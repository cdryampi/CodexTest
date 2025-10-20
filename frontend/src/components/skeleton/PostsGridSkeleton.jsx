import PostCardSkeleton from './PostCardSkeleton.jsx';
import { cn } from '../../lib/utils.js';

function PostsGridSkeleton({ count = 6, className }) {
  const safeCount = Number.isFinite(Number(count)) ? Math.max(1, Math.trunc(Number(count))) : 6;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando publicaciones recientes"
      className={cn('mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3', className)}
    >
      <span className="sr-only">Cargando publicaciones recientes...</span>
      {Array.from({ length: safeCount }).map((_, index) => (
        <PostCardSkeleton key={`post-skeleton-${index}`} />
      ))}
    </div>
  );
}

export default PostsGridSkeleton;
