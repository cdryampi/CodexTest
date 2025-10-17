import { TagIcon } from '@heroicons/react/24/outline';

function TagFilter({ options = [], selectedTags = [], onToggle, onClear }) {
  if (!options.length) {
    return null;
  }

  const isSelected = (value) => selectedTags.includes(value);

  return (
    <section
      aria-labelledby="tag-filter-title"
      className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <TagIcon className="h-5 w-5 text-sky-500 dark:text-sky-300" aria-hidden="true" />
          <span id="tag-filter-title">Filtrar por etiquetas</span>
        </div>
        {selectedTags.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-sky-600 transition duration-200 hover:text-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-300 dark:hover:text-sky-200 dark:focus-visible:ring-offset-slate-900"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {options.map((tag) => {
          const active = isSelected(tag.value);
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => onToggle?.(tag.value)}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                active
                  ? 'border-sky-500/60 bg-sky-100 text-sky-700 shadow-sm dark:border-sky-400/60 dark:bg-sky-900/50 dark:text-sky-200'
                  : 'border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-sky-400/60 dark:hover:text-sky-200'
              }`}
              aria-pressed={active}
            >
              <span>#{tag.label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 transition duration-200 group-hover:bg-sky-100 group-hover:text-sky-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-sky-900/60 dark:group-hover:text-sky-200">
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default TagFilter;
