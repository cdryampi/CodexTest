import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PostCard from './PostCard';
import Skeleton from './Skeleton';

function PostList({ items = [], loading = false, error = null, onRetry, emptyMessage = 'Sin resultados por ahora.' }) {
  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} variant="card" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">No se pudieron cargar los artículos.</h3>
              <p className="text-sm opacity-80">{error.message || 'Intenta nuevamente más tarde.'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-red-900"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-10 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        <p className="text-lg font-medium">{emptyMessage}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:text-slate-300 dark:hover:border-sky-400 dark:hover:text-sky-200 dark:focus-visible:ring-offset-slate-900"
          >
            Volver a cargar
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {items.map((item) => (
        <PostCard key={item.slug} post={item} />
      ))}
    </div>
  );
}

export default PostList;
