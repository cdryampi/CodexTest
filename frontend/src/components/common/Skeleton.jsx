const cx = (...classes) =>
  classes
    .flat()
    .filter(Boolean)
    .join(' ');

const SkeletonCard = ({ className = '' }) => (
  <div
    aria-hidden="true"
    role="presentation"
    className={cx(
      'animate-pulse rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/50',
      className
    )}
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

const SkeletonMedia = ({ className = '' }) => (
  <div
    aria-hidden="true"
    role="presentation"
    className={cx('aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200/90 dark:bg-slate-700/70', className)}
  />
);

const SkeletonText = ({ className = '', lines = 1 }) => {
  const safeLines = Math.max(1, Math.floor(lines));
  return (
    <div aria-hidden="true" className={cx('space-y-2', className)}>
      {Array.from({ length: safeLines }).map((_, index) => (
        <div
          key={index}
          className="h-4 w-full animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-700/70"
        />
      ))}
    </div>
  );
};

function Skeleton({ variant = 'text', className = '', lines = 1 }) {
  if (variant === 'card') {
    return <SkeletonCard className={className} />;
  }

  if (variant === 'media') {
    return <SkeletonMedia className={className} />;
  }

  return <SkeletonText className={className} lines={lines} />;
}

Skeleton.Card = SkeletonCard;
Skeleton.Media = SkeletonMedia;
Skeleton.Text = SkeletonText;

Skeleton.Group = function SkeletonGroup({
  count = 1,
  variant = 'text',
  className = '',
  itemClassName = '',
  lines = 1
}) {
  const safeCount = Math.max(0, Math.floor(count));
  return (
    <div className={className}>
      {Array.from({ length: safeCount }).map((_, index) => (
        <Skeleton key={index} variant={variant} className={itemClassName} lines={lines} />
      ))}
    </div>
  );
};

export default Skeleton;
