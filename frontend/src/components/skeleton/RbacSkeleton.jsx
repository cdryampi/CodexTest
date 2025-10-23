import Skeleton from './Skeleton.jsx';

function RbacSkeleton() {
  return (
    <div className="flex min-h-[60vh] flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70" role="status" aria-live="polite">
      <span className="sr-only">Cargando permisos y perfil del usuario...</span>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="hidden w-full max-w-xs flex-shrink-0 flex-col gap-4 lg:flex">
          <Skeleton className="h-10 w-3/4 rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-11/12 rounded-2xl" />
        </aside>
        <div className="flex w-full flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-8 w-64 rounded-2xl" />
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Skeleton className="h-11 w-full rounded-2xl sm:w-40" />
              <Skeleton className="h-11 w-full rounded-2xl sm:w-40" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 p-4 dark:border-slate-800/60">
            <Skeleton className="h-6 w-40 rounded-full" />
            <div className="grid gap-3 md:grid-cols-2">
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
              <Skeleton className="h-12 rounded-2xl" />
            </div>
            <Skeleton className="h-48 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RbacSkeleton;
