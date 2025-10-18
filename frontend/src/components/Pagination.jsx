import { Fragment } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const createPageRange = (current, total) => {
  const delta = 1;
  const pages = [];
  for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i += 1) {
    pages.push(i);
  }
  if (pages[0] !== 1) {
    pages.unshift(1);
  }
  if (pages[pages.length - 1] !== total) {
    pages.push(total);
  }
  return Array.from(new Set(pages));
};

function Pagination({ page = 1, totalItems = 0, pageSize = 10, onPageChange }) {
  const totalPages = pageSize > 0 ? Math.ceil(totalItems / pageSize) : 1;

  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) {
      return;
    }
    onPageChange?.(nextPage);
  };

  const pages = createPageRange(page, totalPages);

  return (
    <nav className="flex justify-center" aria-label="Paginación de posts">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 p-2 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70">
        <button
          type="button"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Ir a la página anterior"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Anterior
        </button>
        <div className="flex items-center gap-1">
          {pages.map((pageNumber, index) => {
            const isActive = pageNumber === page;
            const hasEllipsis = index > 0 && pageNumber - pages[index - 1] > 1;

            return (
              <Fragment key={pageNumber}>
                {hasEllipsis ? (
                  <span className="px-2 text-sm text-slate-400 dark:text-slate-500" aria-hidden="true">
                    …
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => handlePageChange(pageNumber)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-600/90'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Ir a la página ${pageNumber}`}
                >
                  {pageNumber}
                </button>
              </Fragment>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Ir a la página siguiente"
        >
          Siguiente
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
