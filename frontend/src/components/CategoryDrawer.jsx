import { useEffect, useMemo } from 'react';
import { Badge, Button, TextInput, ToggleSwitch } from 'flowbite-react';
import {
  Squares2X2Icon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

function CategoryDrawer({
  open = false,
  onClose,
  categories = [],
  selected = null,
  loading = false,
  error = null,
  onSelect,
  onRetry,
  searchValue = '',
  onSearchChange,
  onSearchClear,
  onlyActive = false,
  onOnlyActiveChange,
  onResetFilters
}) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  const hasFiltersApplied = useMemo(() => {
    return Boolean(searchValue?.trim()) || !onlyActive || Boolean(selected);
  }, [onlyActive, searchValue, selected]);

  const selectionHidden = useMemo(() => {
    if (!selected) {
      return false;
    }
    return !categories.some((category) => category.slug === selected);
  }, [categories, selected]);

  const handleSelect = (slug) => {
    if (slug === selected) {
      onSelect?.(null);
      return;
    }
    onSelect?.(slug);
  };

  const handleSearchChange = (event) => {
    onSearchChange?.(event.target.value);
  };

  const handleClearSearch = () => {
    onSearchClear?.();
  };

  const handleToggleActive = (value) => {
    onOnlyActiveChange?.(value);
  };

  const drawerLabelId = 'category-drawer-label';

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden="true"
        onClick={() => onClose?.()}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerLabelId}
        className={`fixed top-0 left-0 z-50 flex h-screen w-full max-w-xs flex-col transform border-r border-slate-200 bg-white px-5 py-6 shadow-xl transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900/95 sm:max-w-sm ${
          open ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <Squares2X2Icon className="h-5 w-5 text-sky-500 dark:text-sky-300" aria-hidden="true" />
            <span id={drawerLabelId}>Categorías</span>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus-visible:ring-offset-slate-900"
            aria-label="Cerrar menú de categorías"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Utiliza los filtros para explorar publicaciones por categoría y encuentra contenido a tu medida.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {hasFiltersApplied ? (
            <Button color="light" size="xs" onClick={() => onResetFilters?.()}>
              Restablecer
            </Button>
          ) : null}
          <Button color="light" size="xs" onClick={() => onSelect?.(null)} disabled={!selected}>
            Ver todas
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <TextInput
              type="search"
              value={searchValue}
              onChange={handleSearchChange}
              icon={MagnifyingGlassIcon}
              placeholder="Buscar categorías"
              aria-label="Buscar categorías"
              className="pr-10"
              disabled={loading}
            />
            {searchValue ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus-visible:ring-offset-slate-900"
                aria-label="Limpiar búsqueda de categorías"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <ToggleSwitch
            checked={onlyActive}
            label={onlyActive ? 'Mostrando solo categorías activas' : 'Incluyendo categorías inactivas'}
            onChange={handleToggleActive}
            className="flex w-full items-center justify-between rounded-2xl bg-slate-100/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400"
          />
        </div>

        {selectionHidden ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700 shadow-sm dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-200">
            La categoría seleccionada no coincide con los filtros actuales.
          </div>
        ) : null}

        <div className="mt-6 flex-1 overflow-y-auto">
          {error ? (
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
          ) : loading ? (
            <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-sm dark:bg-slate-900/60">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="h-4 flex-1 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                  <div className="h-4 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                </div>
              ))}
            </div>
          ) : categories.length ? (
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
          ) : (
            <div className="space-y-3 rounded-2xl bg-white/80 p-4 text-sm text-slate-500 shadow-sm dark:bg-slate-900/60 dark:text-slate-300">
              <p>
                {searchValue?.trim()
                  ? 'No encontramos categorías que coincidan con tu búsqueda. Ajusta los filtros para ver más opciones.'
                  : 'No hay categorías disponibles por ahora.'}
              </p>
              {searchValue?.trim() ? (
                <Button color="light" size="sm" onClick={handleClearSearch}>
                  Limpiar búsqueda
                </Button>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button color="dark" onClick={() => onClose?.()}>
            Cerrar
          </Button>
        </div>
      </aside>
    </>
  );
}

export default CategoryDrawer;
