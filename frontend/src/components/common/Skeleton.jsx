function Skeleton({ variant = 'text', className = '' }) {
  if (variant === 'card') {
    return (
      <div
        className={`animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50 ${className}`.trim()}
      >
        <div className="aspect-[16/9] w-full rounded-xl bg-slate-200/90 dark:bg-slate-700/70" />
        <div className="mt-5 space-y-3">
          <div className="h-5 w-3/4 rounded-full bg-slate-200/90 dark:bg-slate-700/70" />
          <div className="h-4 w-full rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
          <div className="h-4 w-5/6 rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
          <div className="flex gap-2 pt-4">
            <div className="h-6 w-24 rounded-full bg-slate-200/90 dark:bg-slate-700/70" />
            <div className="h-6 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/60" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'media') {
    return (
      <div
        className={`aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200/90 dark:bg-slate-700/70 ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`h-4 w-full animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-700/70 ${className}`.trim()}
    />
  );
}

export default Skeleton;
