import Skeleton from './Skeleton.jsx';
import { cn } from '../../lib/utils.js';

function HeroSkeleton({ className }) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Cargando contenido destacado"
      className={cn(
        'relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-gray-50 to-white px-6 py-20 shadow-sm transition-colors duration-500 dark:border-slate-800 dark:from-gray-900 dark:to-gray-950 sm:px-10 lg:px-16',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 -z-10 before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.25),_transparent_60%)] before:content-[''] dark:before:bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.35),_transparent_60%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-6xl flex-col-reverse items-center gap-14 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <Skeleton as="span" className="h-9 w-48 rounded-full" />
          <Skeleton as="h1" className="h-12 w-full rounded-2xl sm:h-14" />
          <Skeleton as="p" className="h-4 w-full rounded-full" />
          <Skeleton as="p" className="h-4 w-5/6 rounded-full" />
          <div className="mt-4 flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Skeleton className="h-12 w-full rounded-full sm:w-44" />
            <Skeleton className="h-12 w-full rounded-full sm:w-40" />
          </div>
        </div>
        <div className="relative w-full max-w-xl">
          <Skeleton className="aspect-[5/3] w-full rounded-3xl border border-slate-200/80 shadow-2xl ring-1 ring-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/30 dark:ring-slate-50/10" />
        </div>
      </div>
      <span className="sr-only">Cargando contenido destacado...</span>
    </section>
  );
}

export default HeroSkeleton;
