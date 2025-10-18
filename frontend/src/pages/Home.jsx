import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Select } from 'flowbite-react';
import { getCategories, listPosts } from '../api';
import PostList from '../components/PostList';
import TagFilter from '../components/TagFilter';
import Pagination from '../components/Pagination';
import CategoryDrawer from '../components/CategoryDrawer';
import {
  useUIStore,
  selectOrdering,
  selectPage,
  selectSearch,
  selectSelectedTags,
  selectSelectedCategory
} from '../store/useUI';

const ORDER_OPTIONS = [
  { value: '-date', label: 'Más recientes' },
  { value: 'date', label: 'Más antiguos' },
  { value: 'title', label: 'Título (A-Z)' }
];

function Home() {
  const search = useUIStore(selectSearch);
  const ordering = useUIStore(selectOrdering);
  const selectedTags = useUIStore(selectSelectedTags);
  const selectedCategory = useUIStore(selectSelectedCategory);
  const page = useUIStore(selectPage);

  const setOrdering = useUIStore((state) => state.setOrdering);
  const setSelectedTags = useUIStore((state) => state.setSelectedTags);
  const setSelectedCategory = useUIStore((state) => state.setSelectedCategory);
  const setPage = useUIStore((state) => state.setPage);

  const [state, setState] = useState({ items: [], count: 0, loading: false, error: null });
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

  const fetchPosts = useCallback(
    async (controller) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await listPosts({
          page,
          search,
          ordering,
          tags: selectedTags,
          category: selectedCategory,
          signal: controller.signal
        });

        const results = Array.isArray(data.results) ? data.results : [];
        const count = typeof data.count === 'number' ? data.count : 0;
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

        setState({ items: results, count, loading: false, error: null });

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
        if (error.name === 'AbortError') {
          return;
        }
        setState((prev) => ({ ...prev, loading: false, error }));
      }
    },
    [ordering, page, search, selectedTags, selectedCategory, setPage]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(controller);

    return () => {
      controller.abort();
    };
  }, [fetchPosts, reloadToken]);

  const handleOrderingChange = (event) => {
    setOrdering(event.target.value);
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

  const openCategoryDrawer = () => {
    setIsCategoryDrawerOpen(true);
  };

  const closeCategoryDrawer = () => {
    setIsCategoryDrawerOpen(false);
  };

  const clearSelectedCategory = () => {
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Últimas publicaciones</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Explora artículos creados con cariño por la comunidad. Combina búsqueda, filtros y ordenamientos para encontrar la historia perfecta.
        </p>
        {activeFiltersLabel ? (
          <p className="text-xs uppercase tracking-wide text-sky-600 dark:text-sky-300">
            {activeFiltersLabel}
          </p>
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
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Página actual</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{page}</span>
          </div>
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

        <TagFilter value={selectedTags} onChange={handleTagsChange} />

        <PostList
          items={state.items}
          loading={state.loading}
          error={state.error}
          onRetry={handleRetry}
          emptyMessage="Sin resultados. Ajusta la búsqueda o prueba con otras etiquetas."
        />

        <Pagination
          page={page}
          totalItems={state.count}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
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
  );
}

export default Home;
