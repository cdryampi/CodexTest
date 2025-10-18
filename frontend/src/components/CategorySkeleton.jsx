function CategorySkeleton({ items = 6 }) {
  const placeholders = Array.from({ length: Math.max(1, items) });

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <div className="h-5 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
      <div className="space-y-3">
        {placeholders.map((_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="h-4 flex-1 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
            <div className="h-4 w-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategorySkeleton;
