import { FaceFrownIcon } from '@heroicons/react/24/outline';

function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/60">
      <FaceFrownIcon className="h-12 w-12 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No encontramos resultados</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Ajusta tu búsqueda o prueba con otras etiquetas para descubrir nuevas publicaciones.
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-50 px-5 py-2 text-sm font-semibold text-sky-600 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-sky-400/40 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60 dark:focus-visible:ring-offset-slate-900"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

export default EmptyState;
