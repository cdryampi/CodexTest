import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }
    onPageChange?.(page);
  };

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="flex items-center justify-center" aria-label="Paginación de posts">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 p-2 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/60">
        <button
          type="button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          Anterior
        </button>
        <div className="flex items-center gap-1">
          {pages.map((page) => {
            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm hover:bg-sky-600/90'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Siguiente
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
