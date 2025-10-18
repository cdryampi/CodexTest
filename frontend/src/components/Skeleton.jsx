function Skeleton({ variant = 'text' }) {
  if (variant === 'card') {
    return (
      <div className="animate-pulse rounded-3xl border border-slate-200 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mb-4 h-40 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3">
          <div className="h-5 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-5/6 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="mt-6 flex gap-2">
            <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    );
  }

  return <div className="h-4 w-full animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />;
}

export default Skeleton;
