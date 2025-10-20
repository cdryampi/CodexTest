import Skeleton from './Skeleton.jsx';
import { cn } from '../../lib/utils.js';

function PostCardSkeleton({ className }) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      aria-hidden="true"
    >
      <Skeleton className="aspect-[16/9] w-full rounded-none rounded-t-3xl" />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <Skeleton className="h-4 w-24 rounded-full" />
        <Skeleton as="h3" className="h-6 w-4/5 rounded-2xl" />
        <div className="space-y-3">
          <Skeleton as="p" className="h-4 w-full rounded-full" />
          <Skeleton as="p" className="h-4 w-5/6 rounded-full" />
          <Skeleton as="p" className="h-4 w-3/4 rounded-full" />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-16 rounded-full" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="mt-auto flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-24 rounded-full" />
          <Skeleton className="h-4 w-20 rounded-full" />
        </div>
        <div className="pt-4">
          <Skeleton className="h-11 w-32 rounded-full" />
        </div>
      </div>
    </article>
  );
}

export default PostCardSkeleton;
