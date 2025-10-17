import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, Badge } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import Fuse from 'fuse.js';
import SearchBar from '../components/SearchBar';
import TagFilter from '../components/TagFilter';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import posts from '../data/posts.json';

const POSTS_PER_PAGE = 6;
const STORAGE_KEY = 'blog:list:state';

const parseSearchParams = (searchString) => {
  const params = new URLSearchParams(searchString);
  const rawQuery = params.get('q') ?? '';
  const tagsValue = params.get('tags');
  const tagList = tagsValue ? tagsValue.split(',').filter(Boolean) : [];
  const pageParam = params.get('page');
  const parsedPage = pageParam ? Number.parseInt(pageParam, 10) : undefined;

  return {
    hasQuery: params.has('q'),
    query: rawQuery,
    hasTags: params.has('tags'),
    tags: tagList,
    hasPage: params.has('page'),
    page: !Number.isNaN(parsedPage) && parsedPage && parsedPage > 0 ? parsedPage : 1
  };
};

const readStoredState = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const q = typeof parsed?.q === 'string' ? parsed.q : '';
    const tags = Array.isArray(parsed?.tags) ? parsed.tags.filter((tag) => typeof tag === 'string') : [];
    const page = Number.isInteger(parsed?.page) && parsed.page > 0 ? parsed.page : 1;
    return { q, tags, page };
  } catch (error) {
    return null;
  }
};

function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);

  const availableTagOptions = useMemo(() => {
    const collator = new Intl.Collator('es', { sensitivity: 'base' });
    const accumulator = new Map();

    posts.forEach((post) => {
      post.tags.forEach((value, index) => {
        const label = post.etiquetas?.[index] ?? value;
        const existing = accumulator.get(value);
        if (existing) {
          existing.count += 1;
        } else {
          accumulator.set(value, { value, label, count: 1 });
        }
      });
    });

    return Array.from(accumulator.values()).sort((a, b) => collator.compare(a.label, b.label));
  }, []);

  const availableTagSet = useMemo(
    () => new Set(availableTagOptions.map((tag) => tag.value)),
    [availableTagOptions]
  );

  const sanitizeTags = useCallback(
    (tags = []) => {
      const unique = new Set();
      tags.forEach((tag) => {
        if (typeof tag === 'string' && availableTagSet.has(tag)) {
          unique.add(tag);
        }
      });
      return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    },
    [availableTagSet]
  );

  const storedState = useMemo(() => readStoredState(), []);
  const paramsState = useMemo(() => parseSearchParams(location.search), [location.search]);

  const [searchQuery, setSearchQuery] = useState(() =>
    paramsState.hasQuery ? paramsState.query : storedState?.q ?? ''
  );
  const [selectedTags, setSelectedTags] = useState(() =>
    paramsState.hasTags ? sanitizeTags(paramsState.tags) : sanitizeTags(storedState?.tags ?? [])
  );
  const [currentPage, setCurrentPage] = useState(() =>
    paramsState.hasPage ? paramsState.page : storedState?.page ?? 1
  );

  const syncUrl = useCallback(
    (state, replace = false) => {
      const params = new URLSearchParams();
      if (state.q) {
        params.set('q', state.q);
      }
      if (state.tags?.length) {
        params.set('tags', state.tags.join(','));
      }
      if (state.page && state.page > 1) {
        params.set('page', String(state.page));
      }

      const nextSearch = params.toString();
      const currentSearch = location.search.startsWith('?')
        ? location.search.slice(1)
        : location.search;

      if (nextSearch === currentSearch) {
        return;
      }

      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : ''
        },
        { replace }
      );
    },
    [navigate, location.pathname, location.search]
  );

  const isFirstSync = useRef(true);

  useEffect(() => {
    const parsed = parseSearchParams(location.search);
    const hasAnyParam = parsed.hasQuery || parsed.hasTags || parsed.hasPage;

    if (isFirstSync.current) {
      isFirstSync.current = false;
      if (!hasAnyParam && storedState) {
        const normalizedTags = sanitizeTags(storedState.tags ?? []);
        setSearchQuery(storedState.q ?? '');
        setSelectedTags(normalizedTags);
        setCurrentPage(storedState.page ?? 1);
        syncUrl(
          {
            q: (storedState.q ?? '').trim(),
            tags: normalizedTags,
            page: storedState.page ?? 1
          },
          true
        );
        return;
      }
    }

    setSearchQuery(parsed.hasQuery ? parsed.query : '');
    setSelectedTags(parsed.hasTags ? sanitizeTags(parsed.tags) : []);
    setCurrentPage(parsed.hasPage ? parsed.page : 1);
  }, [location.search, sanitizeTags, storedState, syncUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stateToStore = {
      q: searchQuery,
      tags: selectedTags,
      page: currentPage
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
  }, [searchQuery, selectedTags, currentPage]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    syncUrl({ q: trimmedQuery, tags: selectedTags, page: currentPage });
  }, [searchQuery, selectedTags, currentPage, syncUrl]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === '/' && !event.defaultPrevented) {
        const target = event.target;
        const isFormElement =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target && target.isContentEditable);

        if (!isFormElement && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
      }

      if (event.key === 'Escape') {
        if (document.activeElement === searchInputRef.current || searchQuery) {
          event.preventDefault();
          if (searchQuery) {
            setSearchQuery('');
            setCurrentPage(1);
          }
          if (document.activeElement === searchInputRef.current) {
            searchInputRef.current.blur();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [searchQuery]);

  const filteredByTags = useMemo(() => {
    if (!selectedTags.length) {
      return posts;
    }

    return posts.filter((post) => selectedTags.every((tag) => post.tags.includes(tag)));
  }, [selectedTags]);

  const fuseDataset = useMemo(
    () =>
      filteredByTags.map((post) => ({
        ...post,
        title: post.titulo,
        excerpt: post.resumen,
        content: post.contenido.join(' '),
        tags: [...post.tags, ...(post.etiquetas ?? [])]
      })),
    [filteredByTags]
  );

  const fuse = useMemo(
    () =>
      new Fuse(fuseDataset, {
        keys: [
          { name: 'title', weight: 0.4 },
          { name: 'excerpt', weight: 0.3 },
          { name: 'content', weight: 0.2 },
          { name: 'tags', weight: 0.1 }
        ],
        threshold: 0.35,
        ignoreLocation: true,
        includeScore: true
      }),
    [fuseDataset]
  );

  const trimmedQuery = searchQuery.trim();

  const searchedPosts = useMemo(() => {
    if (!trimmedQuery) {
      return filteredByTags;
    }

    return fuse.search(trimmedQuery).map((result) => result.item);
  }, [filteredByTags, fuse, trimmedQuery]);

  const resultsCount = searchedPosts.length;
  const totalPages = Math.max(1, Math.ceil(resultsCount / POSTS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
    return searchedPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);
  }, [searchedPosts, currentPage]);

  const resultsLabel = `${resultsCount} ${resultsCount === 1 ? 'resultado' : 'resultados'}`;

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    searchInputRef.current?.focus();
  };

  const handleToggleTag = (value) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else if (availableTagSet.has(value)) {
        next.add(value);
      }
      return Array.from(next).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    });
    setCurrentPage(1);
  };

  const handleClearTags = () => {
    setSelectedTags([]);
    setCurrentPage(1);
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setCurrentPage(1);
    searchInputRef.current?.focus();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <section className="space-y-12">
      <header className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
          Blog tecnológico en español
        </p>
        <h1 className="text-4xl font-bold text-slate-900 transition-colors duration-300 dark:text-white sm:text-5xl">
          Ideas frescas para construir interfaces modernas
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300">
          Explora artículos pensados para acelerar tus proyectos con React, Tailwind CSS y Flowbite. Cada publicación incluye consejos prácticos y buenas prácticas listas para aplicar hoy mismo.
        </p>
      </header>

      <div className="space-y-6">
        <div className="space-y-3">
          <SearchBar
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearchChange}
            onClear={handleClearSearch}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <p className="font-medium text-slate-600 dark:text-slate-300">{resultsLabel}</p>
            <p className="inline-flex items-center gap-2">
              <span className="hidden sm:inline">Atajos:</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  /
                </kbd>
                enfocar
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  Esc
                </kbd>
                limpiar
              </span>
            </p>
          </div>
        </div>

        <TagFilter
          options={availableTagOptions}
          selectedTags={selectedTags}
          onToggle={handleToggleTag}
          onClear={handleClearTags}
        />
      </div>

      {paginatedPosts.length > 0 ? (
        <>
          <div className="grid gap-8 md:grid-cols-2">
            {paginatedPosts.map((post) => (
              <Card
                key={post.id}
                imgAlt={post.imageAlt ?? post.imagenAlt}
                imgSrc={post.image ?? post.imagen}
                className="flex h-full flex-col justify-between overflow-hidden border border-slate-200 bg-white/90 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/10 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:shadow-sky-400/10"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {post.etiquetas.map((tag) => (
                      <Badge
                        key={tag}
                        color="info"
                        className="bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 dark:text-white">
                    {post.titulo}
                  </h2>
                  <p className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                      {post.autor}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" aria-hidden="true" />
                      {new Date(post.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                    </span>
                  </p>
                  <p className="text-base text-slate-600 dark:text-slate-300">{post.resumen}</p>
                </div>
                <div className="pt-4">
                  <Link
                    to={`/post/${post.id}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition duration-300 hover:gap-3 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200"
                  >
                    Leer artículo completo
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </>
      ) : (
        <EmptyState onReset={handleResetAll} />
      )}

      <section
        id="acerca"
        className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <h2 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 dark:text-white">
          Sobre este blog
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Este proyecto demuestra cómo combinar React con Tailwind CSS, Flowbite y React Router para construir un blog estático moderno. Utiliza datos locales en formato JSON y está preparado para desplegarse automáticamente en GitHub Pages mediante GitHub Actions.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" aria-hidden="true" />
            Comentarios moderados localmente
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-4 w-4" aria-hidden="true" />
            Actualizaciones continuas
          </span>
        </div>
      </section>
    </section>
  );
}

export default Home;
