import { Sidebar, Badge, Button } from 'flowbite-react';
import { Squares2X2Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

function CategorySidebar({ categories = [], selected = null, error = null, onSelect, onRetry }) {
  const handleSelect = (slug) => {
    if (slug === selected) {
      onSelect?.(null);
      return;
    }
    onSelect?.(slug);
  };

  if (error) {
    return (
      <div className="space-y-4 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="h-6 w-6" aria-hidden="true" />
          <div>
            <p className="font-semibold">No se pudieron cargar las categorías.</p>
            <p className="text-sm opacity-80">Inténtalo nuevamente para seguir filtrando el contenido.</p>
          </div>
        </div>
        <Button color="failure" onClick={onRetry} size="sm">
          Reintentar
        </Button>
      </div>
    );
  }

  if (!categories.length) {
    return (
      <Sidebar aria-label="Categorías del blog" className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            <div className="space-y-2 p-4 text-sm text-slate-500 dark:text-slate-400">
              <p>No hay categorías disponibles por ahora.</p>
            </div>
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
    );
  }

  return (
    <Sidebar aria-label="Categorías del blog" className="rounded-3xl border border-slate-200 bg-white/80 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Squares2X2Icon className="h-5 w-5 text-sky-500 dark:text-sky-300" aria-hidden="true" />
              <span>Categorías</span>
            </div>
            <Button color="light" size="xs" onClick={() => onSelect?.(null)} disabled={!selected}>
              Ver todas
            </Button>
          </div>
          <div className="px-2 pb-3">
            <ul className="space-y-1">
              {categories.map((category) => {
                const isActive = category.slug === selected;
                const count = typeof category.post_count === 'number' ? category.post_count : 0;
                return (
                  <li key={category.slug}>
                    <button
                      type="button"
                      onClick={() => handleSelect(category.slug)}
                      className={`group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                        isActive
                          ? 'bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-900/50 dark:text-sky-200'
                          : 'text-slate-600 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-sky-600 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-sky-200'
                      }`}
                    >
                      <span className="font-medium">{category.name}</span>
                      <Badge color={isActive ? 'info' : 'gray'} size="sm">
                        {count}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}

export default CategorySidebar;
