import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Select } from 'flowbite-react';
import { Helmet } from 'react-helmet-async';
import { getCategories, listPosts } from '../api';
import PostList from '../components/PostList';
import MotionProvider from '../components/motion/MotionProvider';
import AnimatedPostCard from '../components/motion/AnimatedPostCard';
import SearchBar from '../components/search/SearchBar';
import TagFilters from '../components/filters/TagFilters';
import Pagination from '../components/Pagination';
import CategoryDrawer from '../components/CategoryDrawer';
import Skeleton from '../components/common/Skeleton';
import {
  useUIStore,
  selectOrdering,
  selectPage,
  selectSearch,
  selectSelectedTags,
  selectSelectedCategory
} from '../store/useUI';
import chunk from '../utils/chunk';
import {
  buildPageTitle,
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_CARD,
  sanitizeMetaText
} from '../seo/config.js';

const HOME_TITLE = 'Inicio';
const HOME_DESCRIPTION =
  'Explora guías prácticas, tutoriales y novedades de frontend moderno con React, Tailwind CSS y Flowbite.';

const ORDER_OPTIONS = [
  { value: '-date', label: 'Más recientes' },
  { value: 'date', label: 'Más antiguos' },
  { value: 'title', label: 'Título (A-Z)' }
];

const INITIAL_BATCH_SIZE = 9;
const SUBSEQUENT_BATCH_SIZE = 6;

const parseNextPage = (value) => {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === 'string' && value) {
    const match = value.match(/[?&]page=(\d+)/i);
    if (match && match[1]) {
      const parsed = Number.parseInt(match[1], 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
};

const getPostKey = (post) => {
  if (!post || typeof post !== 'object') {
    return null;
  }
  if (post.slug) {
    return `slug:${post.slug}`;
  }
  if (post.id != null) {
    return `id:${post.id}`;
  }
  if (post.title) {
    return `title:${post.title}`;
  }
  try {
    return `json:${JSON.stringify(post)}`;
  } catch (error) {
    return null;
  }
};

const mergeResults = (currentItems, incomingItems, replace = false) => {
  const merged = [];
  const seen = new Set();

  const append = (item) => {
    if (!item) {
      return;
    }
    const key = getPostKey(item) ?? `fallback:${merged.length}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(item);
  };

  if (!replace) {
    currentItems.forEach(append);
  }

  incomingItems.forEach(append);

  return merged;
};

function Home() {
  const search = useUIStore(selectSearch);
  const ordering = useUIStore(selectOrdering);
  const selectedTags = useUIStore(selectSelectedTags);
  const selectedCategory = useUIStore(selectSelectedCategory);
  const page = useUIStore(selectPage);

  const setSearch = useUIStore((state) => state.setSearch);
  const setOrdering = useUIStore((state) => state.setOrdering);
  const setSelectedTags = useUIStore((state) => state.setSelectedTags);
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory);
  const setPage = useUIStore((state) => state.setPage);

  const [state, setState] = useState({
    items: [],
    count: 0,
    loading: false,
    error: null,
    loadingMore: false,
    loadMoreError: null,
    nextPage: null,
    hasMore: false
  });
  const [reloadToken, setReloadToken] = useState(0);
  const pageSizeRef = useRef(10);
  const [pageSize, setPageSize] = useState(10);
  const [categoriesState, setCategoriesState] = useState({
    items: [],
    loading: true,
    error: null
  });
  const [categoriesToken, setCategoriesToken] = useState(0);
  const [categorySearch, setCategorySearch] = useState('');
  const [onlyActiveCategories, setOnlyActiveCategories] = useState(true);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);
  const [intersectionObserverSupported, setIntersectionObserverSupported] = useState(false);
  const [observerChecked, setObserverChecked] = useState(false);
  const [visibleChunkCount, setVisibleChunkCount] = useState(1);

  const sentinelRef = useRef(null);
  const observerRef = useRef(null);
  const inFlightPagesRef = useRef(new Set());
  const loadedPagesRef = useRef(new Set());

  const useInfiniteScroll = intersectionObserverSupported;

  const batches = useMemo(() => {
    if (!useInfiniteScroll) {
      return [];
    }
    return chunk(state.items, SUBSEQUENT_BATCH_SIZE, { initialChunkSize: INITIAL_BATCH_SIZE });
  }, [state.items, useInfiniteScroll]);

  const visibleItems = useMemo(() => {
    if (!useInfiniteScroll) {
      return state.items;
    }
    if (!batches.length) {
      return [];
    }
    return batches
      .slice(0, Math.max(1, Math.min(visibleChunkCount, batches.length)))
      .reduce((accumulator, batch) => accumulator.concat(batch), []);
  }, [batches, state.items, useInfiniteScroll, visibleChunkCount]);

  const hasBufferedChunks = useMemo(
    () => useInfiniteScroll && batches.length > Math.max(1, visibleChunkCount),
    [batches.length, useInfiniteScroll, visibleChunkCount]
  );

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'IntersectionObserver' in window;
    setIntersectionObserverSupported(supported);
    setObserverChecked(true);
  }, []);

  useEffect(() => {
    if (!useInfiniteScroll) {
      return;
    }

    if (!batches.length) {
      setVisibleChunkCount(1);
      return;
    }

    setVisibleChunkCount((current) => Math.min(current, batches.length));
  }, [batches.length, useInfiniteScroll]);

  const fetchPaginatedPosts = useCallback(
    async (controller) => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        loadMoreError: null,
        loadingMore: false,
        hasMore: false,
        nextPage: null
      }));

      try {
        const data = await listPosts({
          page,
          search,
          ordering,
          tags: selectedTags,
          category: selectedCategory,
          signal: controller?.signal
        });

        const results = Array.isArray(data?.results) ? data.results : [];
        const count = typeof data?.count === 'number' ? data.count : 0;

        const nextPageSize = (() => {
          if (results.length > 0) {
            if (page === 1 || !pageSizeRef.current) {
              return results.length;
            }
            return pageSizeRef.current;
          }
          return page === 1 ? pageSizeRef.current || 10 : pageSizeRef.current || 10;
        })();

        pageSizeRef.current = nextPageSize || 10;
        setPageSize(pageSizeRef.current);

        setState({
          items: results,
          count,
          loading: false,
          error: null,
          loadingMore: false,
          loadMoreError: null,
          hasMore: false,
          nextPage: null
        });

        const effectivePageSize = pageSizeRef.current || 10;
        if (count === 0 && page !== 1) {
          setPage(1);
        } else if (count > 0) {
          const totalPages = Math.max(1, Math.ceil(count / effectivePageSize));
          if (page > totalPages) {
            setPage(totalPages);
          }
        }
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
        setState((prev) => ({
          ...prev,
          loading: false,
          loadingMore: false,
          error,
          hasMore: false,
          nextPage: null
        }));
      }
    },
    [ordering, page, search, selectedCategory, selectedTags, setPage]
  );

  const fetchInfinitePage = useCallback(
    async ({ page: targetPage = 1, pageSize: size = SUBSEQUENT_BATCH_SIZE, replace = false, signal } = {}) => {
      if (!useInfiniteScroll) {
        return;
      }

      if (replace) {
        loadedPagesRef.current = new Set();
        inFlightPagesRef.current = new Set();
      }

      if (loadedPagesRef.current.has(targetPage) || inFlightPagesRef.current.has(targetPage)) {
        return;
      }

      inFlightPagesRef.current.add(targetPage);

      setState((prev) => ({
        ...prev,
        loading: replace ? true : prev.loading,
        error: replace ? null : prev.error,
        loadingMore: replace ? false : true,
        loadMoreError: replace ? null : prev.loadMoreError
      }));

      try {
        const data = await listPosts({
          page: targetPage,
          pageSize: size,
          search,
          ordering,
          tags: selectedTags,
          category: selectedCategory,
          signal
        });

        loadedPagesRef.current.add(targetPage);

        const incoming = Array.isArray(data?.results) ? data.results : [];

        setState((prev) => {
          const items = mergeResults(prev.items, incoming, replace);
          const totalCount = typeof data?.count === 'number' ? data.count : items.length;
          const rawNext = data?.next ?? null;
          const parsedNext = parseNextPage(rawNext);
          const fallbackNext = rawNext ? targetPage + 1 : null;
          const nextCandidate = parsedNext ?? fallbackNext;
          const hasMore = nextCandidate != null && items.length < totalCount;

          return {
            ...prev,
            items,
            count: totalCount,
            loading: false,
            error: null,
            loadingMore: false,
            loadMoreError: null,
            nextPage: hasMore ? nextCandidate : null,
            hasMore
          };
        });
      } catch (error) {
        if (error?.name === 'AbortError') {
          inFlightPagesRef.current.delete(targetPage);
          return;
        }

        if (replace) {
          setState((prev) => ({
            ...prev,
            loading: false,
            loadingMore: false,
            error
          }));
        } else {
          setState((prev) => ({
            ...prev,
            loadingMore: false,
            loadMoreError: error
          }));
        }
      } finally {
        inFlightPagesRef.current.delete(targetPage);
      }
    },
    [ordering, search, selectedCategory, selectedTags, useInfiniteScroll]
  );

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (!observerChecked) {
      return;
    }

    const controller = new AbortController();

    if (useInfiniteScroll) {
      setVisibleChunkCount(1);
      fetchInfinitePage({
        page: 1,
        pageSize: INITIAL_BATCH_SIZE,
        replace: true,
        signal: controller.signal
      });
    } else {
      fetchPaginatedPosts(controller);
    }

    return () => {
      controller.abort();
    };
  }, [fetchInfinitePage, fetchPaginatedPosts, observerChecked, reloadToken, useInfiniteScroll]);

  const fetchCategories = useCallback(
    async (controller, { searchTerm = '', onlyActive = false } = {}) => {
      setCategoriesState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await getCategories({
          with_counts: true,
          q: searchTerm,
          is_active: onlyActive ? 'true' : undefined,
          signal: controller.signal
        });
        const items = Array.isArray(data.results) ? data.results : [];
        setCategoriesState({ items, loading: false, error: null });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setCategoriesState((prev) => ({ ...prev, loading: false, error }));
      }
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller, { searchTerm: categorySearch, onlyActive: onlyActiveCategories });

    return () => {
      controller.abort();
    };
  }, [fetchCategories, categoriesToken, categorySearch, onlyActiveCategories]);

  const handleOrderingChange = (event) => {
    setOrdering(event.target.value);
  };

  const handleSearchChange = (value) => {
    setSearchInput(value);
  };

  const handleSearchDebouncedChange = (value) => {
    setSearch(value.toLowerCase());
  };

  const handleSearchClear = () => {
    setSearch('');
  };

  const handleTagsChange = (tags) => {
    setSelectedTags(tags);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
  };

  const handleRetry = () => {
    setReloadToken((value) => value + 1);
  };

  const handleCategoriesRetry = () => {
    setCategoriesToken((value) => value + 1);
  };

  const handleCategorySearchChange = (value) => {
    setCategorySearch(value);
  };

  const handleCategorySearchClear = () => {
    if (categorySearch) {
      setCategorySearch('');
    } else {
      setCategoriesToken((value) => value + 1);
    }
  };

  const handleCategoryOnlyActiveChange = (value) => {
    setOnlyActiveCategories(Boolean(value));
  };

  const handleCategoryFiltersReset = () => {
    setCategorySearch('');
    setOnlyActiveCategories(true);
    setSelectedCategory(null);
    setCategoriesToken((value) => value + 1);
  };

  const handleLoadMore = useCallback(() => {
    if (!useInfiniteScroll || state.loading || state.loadingMore) {
      return;
    }

    if (hasBufferedChunks) {
      setState((prev) => ({ ...prev, loadMoreError: null }));
      setVisibleChunkCount((value) => Math.min(value + 1, batches.length));
      return;
    }

    if (state.hasMore && state.nextPage) {
      fetchInfinitePage({ page: state.nextPage, pageSize: SUBSEQUENT_BATCH_SIZE });
    }
  }, [batches.length, fetchInfinitePage, hasBufferedChunks, state.hasMore, state.loading, state.loadingMore, state.nextPage, useInfiniteScroll]);

  const handleLoadMoreRetry = useCallback(() => {
    if (!useInfiniteScroll) {
      handleRetry();
      return;
    }

    setState((prev) => ({ ...prev, loadMoreError: null }));

    if (hasBufferedChunks) {
      setVisibleChunkCount((value) => Math.min(value + 1, batches.length));
      return;
    }

    if (state.hasMore && state.nextPage) {
      fetchInfinitePage({ page: state.nextPage, pageSize: SUBSEQUENT_BATCH_SIZE });
    }
  }, [batches.length, fetchInfinitePage, handleRetry, hasBufferedChunks, state.hasMore, state.nextPage, useInfiniteScroll]);

  useEffect(() => {
    if (!observerChecked || !useInfiniteScroll) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            handleLoadMore();
          }
        });
      },
      { rootMargin: '0px 0px 25% 0px', threshold: 0.1 }
    );

    observer.observe(node);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [handleLoadMore, observerChecked, useInfiniteScroll]);

  const selectedCategoryLabel = useMemo(() => {
    if (!selectedCategory) {
      return null;
    }
    const match = categoriesState.items.find((category) => category.slug === selectedCategory);
    return match?.name ?? selectedCategory;
  }, [categoriesState.items, selectedCategory]);

  const activeFiltersLabel = useMemo(() => {
    const filters = [];
    if (search) {
      filters.push(`búsqueda "${search}"`);
    }
    if (selectedTags.length > 0) {
      filters.push(`etiquetas: ${selectedTags.join(', ')}`);
    }
    if (selectedCategoryLabel) {
      filters.push(`categoría: ${selectedCategoryLabel}`);
    }
    return filters.join(' · ');
  }, [search, selectedTags, selectedCategoryLabel]);

  const resultsSummary = useMemo(() => {
    if (state.loading) {
      return 'Buscando resultados…';
    }
    if (state.count === 0) {
      return 'Sin resultados';
    }
    if (state.count === 1) {
      return '1 resultado';
    }
    if (useInfiniteScroll) {
      if (visibleItems.length >= state.count) {
        return `${state.count} resultados`;
      }
      return `Mostrando ${visibleItems.length} de ${state.count} resultados`;
    }
    return `${state.count} resultados`;
  }, [state.count, state.loading, useInfiniteScroll, visibleItems.length]);

  const openCategoryDrawer = () => {
    setIsCategoryDrawerOpen(true);
  };

  const closeCategoryDrawer = () => {
    setIsCategoryDrawerOpen(false);
  };

  const clearSelectedCategory = () => {
    setSelectedCategory(null);
  };

  const showEndOfResultsMessage =
    useInfiniteScroll &&
    !state.loading &&
    !state.loadingMore &&
    !state.loadMoreError &&
    !hasBufferedChunks &&
    !state.hasMore &&
    visibleItems.length > 0;

  const metaTitle = buildPageTitle(HOME_TITLE);
  const metaDescription = sanitizeMetaText(HOME_DESCRIPTION);
  const shareImage = DEFAULT_OG_IMAGE;

  return (
    <Fragment>
      <Helmet prioritizeSeoTags>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={shareImage} />
        <meta name="twitter:card" content={DEFAULT_TWITTER_CARD} />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={shareImage} />
      </Helmet>
      <div className="space-y-10">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Últimas publicaciones</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Explora artículos creados con cariño por la comunidad. Combina búsqueda, filtros y ordenamientos para encontrar la historia perfecta.
          </p>
        {activeFiltersLabel ? (
          <p className="text-xs uppercase tracking-wide text-sky-600 dark:text-sky-300">{activeFiltersLabel}</p>
        ) : null}
      </header>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <label htmlFor="ordering" className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Ordenar por
            </label>
            <Select id="ordering" value={ordering} onChange={handleOrderingChange} aria-label="Ordenar publicaciones">
              {ORDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-2 text-right sm:text-left">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {useInfiniteScroll ? 'Publicaciones visibles' : 'Página actual'}
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {useInfiniteScroll ? visibleItems.length : page}
            </span>
          </div>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <form
            role="search"
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              handleSearchDebouncedChange(searchInput);
            }}
          >
            <SearchBar
              value={searchInput}
              onChange={handleSearchChange}
              onDebouncedChange={handleSearchDebouncedChange}
              onClear={handleSearchClear}
              placeholder="Buscar artículos por título o resumen"
              label="Buscar publicaciones"
              debounceDelay={300}
            />
          </form>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{resultsSummary}</p>
        </div>

        <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex flex-wrap items-center gap-3">
            <Button color="dark" onClick={openCategoryDrawer} disabled={categoriesState.loading}>
              {selectedCategoryLabel ? 'Cambiar categoría' : 'Filtrar por categoría'}
            </Button>
            {categoriesState.loading ? (
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Cargando categorías...
              </span>
            ) : null}
            {categoriesState.error ? (
              <button
                type="button"
                onClick={handleCategoriesRetry}
                className="text-xs font-semibold text-red-600 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:text-red-400 dark:focus-visible:ring-offset-slate-900"
              >
                Reintentar carga de categorías
              </button>
            ) : null}
            {selectedCategoryLabel ? (
              <Badge color="info" className="flex items-center gap-2">
                <span>{selectedCategoryLabel}</span>
                <button
                  type="button"
                  onClick={clearSelectedCategory}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-sky-100 transition hover:bg-sky-200 hover:text-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-900 dark:hover:bg-sky-200 dark:focus-visible:ring-offset-slate-900"
                  aria-label="Quitar filtro de categoría"
                >
                  ×
                </button>
              </Badge>
            ) : (
              <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Todas las categorías</span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selecciona una categoría para refinar los resultados. Puedes combinarla con etiquetas y búsqueda para obtener coincidencias más precisas.
          </p>
        </div>

        <TagFilters selected={selectedTags} onChange={handleTagsChange} />

        <MotionProvider>
          <PostList
            items={visibleItems}
            loading={state.loading}
            error={state.error}
            onRetry={handleRetry}
            emptyMessage="Sin resultados. Ajusta la búsqueda o prueba con otras etiquetas."
            renderItem={(item) => <AnimatedPostCard post={item} />}
          />
        </MotionProvider>

        {useInfiniteScroll ? (
          <div className="space-y-4">
            {state.loadingMore ? (
              <Skeleton.Group
                count={SUBSEQUENT_BATCH_SIZE}
                variant="card"
                className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              />
            ) : null}
            {state.loadMoreError ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">No se pudo cargar el siguiente lote.</p>
                    <p className="text-xs opacity-80">
                      {state.loadMoreError.message || 'Inténtalo nuevamente para seguir explorando publicaciones.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadMoreRetry}
                    className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:bg-amber-500 dark:hover:bg-amber-400 dark:focus-visible:ring-offset-amber-900"
                  >
                    Reintentar carga
                  </button>
                </div>
              </div>
            ) : null}
            {showEndOfResultsMessage ? (
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Has llegado al final de los resultados.
              </p>
            ) : null}
            <span ref={sentinelRef} aria-hidden="true" className="block h-1 w-full" />
          </div>
        ) : (
          <Pagination page={page} totalItems={state.count} pageSize={pageSize} onPageChange={handlePageChange} />
        )}
      </section>

      <CategoryDrawer
        open={isCategoryDrawerOpen}
        onClose={closeCategoryDrawer}
        categories={categoriesState.items}
        selected={selectedCategory}
        loading={categoriesState.loading}
        error={categoriesState.error}
        onSelect={handleCategoryChange}
        onRetry={handleCategoriesRetry}
        searchValue={categorySearch}
        onSearchChange={handleCategorySearchChange}
        onSearchClear={handleCategorySearchClear}
        onlyActive={onlyActiveCategories}
        onOnlyActiveChange={handleCategoryOnlyActiveChange}
        onResetFilters={handleCategoryFiltersReset}
      />
      </div>
    </Fragment>
  );
}

export default Home;
