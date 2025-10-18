import { TagIcon } from '@heroicons/react/24/outline';

const DEFAULT_TAGS = [
  { value: 'ciencia', label: 'Ciencia' },
  { value: 'devops', label: 'DevOps' },
  { value: 'django', label: 'Django' },
  { value: 'docker', label: 'Docker' },
  { value: 'filosofia', label: 'Filosofía' },
  { value: 'react', label: 'React' },
  { value: 'tutorial', label: 'Tutorial' }
];

const normalizeTag = (tag = '') => tag.toString().trim().toLowerCase();

function TagFilters({
  tags = DEFAULT_TAGS,
  selected = [],
  onChange,
  title = 'Filtrar por etiquetas',
  clearLabel = 'Limpiar filtros',
  className = ''
}) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return null;
  }

  const normalizedSelected = selected.map(normalizeTag);

  const emitChange = (nextSelected) => {
    const unique = Array.from(new Set(nextSelected.map(normalizeTag)));
    onChange?.(unique);
  };

  const handleToggle = (value) => {
    const normalized = normalizeTag(value);
    if (!normalized) {
      return;
    }

    const next = new Set(normalizedSelected);
    if (next.has(normalized)) {
      next.delete(normalized);
    } else {
      next.add(normalized);
    }

    emitChange(Array.from(next));
  };

  const handleClear = () => {
    emitChange([]);
  };

  const isActive = (value) => normalizedSelected.includes(normalizeTag(value));

  return (
    <section
      aria-labelledby="tag-filter-title"
      className={`rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70 ${className}`.trim()}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <TagIcon className="h-5 w-5 text-sky-500 dark:text-sky-300" aria-hidden="true" />
          <span id="tag-filter-title">{title}</span>
        </div>
        {normalizedSelected.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-sky-600 transition duration-200 hover:text-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-300 dark:hover:text-sky-200 dark:focus-visible:ring-offset-slate-900"
          >
            {clearLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3" role="list">
        {tags.map((tag) => {
          const value = typeof tag === 'string' ? tag : tag.value;
          const label = typeof tag === 'string' ? `#${tag}` : `#${tag.label}`;
          const active = isActive(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleToggle(value)}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                active
                  ? 'border-sky-500/60 bg-sky-100 text-sky-700 shadow-sm dark:border-sky-400/60 dark:bg-sky-900/50 dark:text-sky-200'
                  : 'border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-sky-400/60 dark:hover:text-sky-200'
              }`}
              aria-pressed={active}
              aria-label={`Filtrar por la etiqueta ${label.replace(/^#/, '')}`}
            >
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default TagFilters;
