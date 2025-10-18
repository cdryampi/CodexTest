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

function TagFilter({ value = [], onChange, availableTags = DEFAULT_TAGS }) {
  if (!availableTags.length) {
    return null;
  }

  const handleToggle = (tag) => {
    if (!tag) {
      return;
    }
    const normalized = tag.trim().toLowerCase();
    const set = new Set(value.map((item) => item.toLowerCase()));
    if (set.has(normalized)) {
      set.delete(normalized);
    } else {
      set.add(normalized);
    }
    onChange?.(Array.from(set));
  };

  const handleClear = () => {
    onChange?.([]);
  };

  const isSelected = (tag) => value.map((item) => item.toLowerCase()).includes(tag.toLowerCase());

  return (
    <section
      aria-labelledby="tag-filter-title"
      className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/70"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <TagIcon className="h-5 w-5 text-sky-500 dark:text-sky-300" aria-hidden="true" />
          <span id="tag-filter-title">Filtrar por etiquetas</span>
        </div>
        {value.length > 0 ? (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-medium text-sky-600 transition duration-200 hover:text-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-300 dark:hover:text-sky-200 dark:focus-visible:ring-offset-slate-900"
          >
            Limpiar filtros
          </button>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        {availableTags.map((tag) => {
          const active = isSelected(tag.value);
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => handleToggle(tag.value)}
              className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
                active
                  ? 'border-sky-500/60 bg-sky-100 text-sky-700 shadow-sm dark:border-sky-400/60 dark:bg-sky-900/50 dark:text-sky-200'
                  : 'border-slate-200 bg-white/80 text-slate-600 hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-sky-400/60 dark:hover:text-sky-200'
              }`}
              aria-pressed={active}
            >
              <span>#{tag.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default TagFilter;
