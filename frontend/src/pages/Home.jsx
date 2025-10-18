import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Select } from 'flowbite-react';
import { listPosts } from '../lib/api';
import PostList from '../components/PostList';
import TagFilter from '../components/TagFilter';
import Pagination from '../components/Pagination';
import {
  useUIStore,
  selectOrdering,
  selectPage,
  selectSearch,
  selectSelectedTags
} from '../store/useUI';

const ORDER_OPTIONS = [
  { value: '-created_at', label: 'Más recientes' },
  { value: 'created_at', label: 'Más antiguos' },
  { value: 'title', label: 'Título (A-Z)' }
];

function Home() {
  const search = useUIStore(selectSearch);
  const ordering = useUIStore(selectOrdering);
  const selectedTags = useUIStore(selectSelectedTags);
  const page = useUIStore(selectPage);

  const setOrdering = useUIStore((state) => state.setOrdering);
  const setSelectedTags = useUIStore((state) => state.setSelectedTags);
  const setPage = useUIStore((state) => state.setPage);

  const [state, setState] = useState({ items: [], count: 0, loading: false, error: null });
  const [reloadToken, setReloadToken] = useState(0);
  const pageSizeRef = useRef(10);
  const [pageSize, setPageSize] = useState(10);

  const fetchPosts = useCallback(
    async (controller) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await listPosts({
          page,
          search,
          ordering,
          tags: selectedTags,
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
    [ordering, page, search, selectedTags, setPage]
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

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
  };

  const handleRetry = () => {
    setReloadToken((value) => value + 1);
  };

  const activeFiltersLabel = useMemo(() => {
    const filters = [];
    if (search) {
      filters.push(`búsqueda "${search}"`);
    }
    if (selectedTags.length > 0) {
      filters.push(`etiquetas: ${selectedTags.join(', ')}`);
    }
    return filters.join(' · ');
  }, [search, selectedTags]);

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
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Página actual</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">{page}</span>
          </div>
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
    </div>
  );
}

export default Home;
