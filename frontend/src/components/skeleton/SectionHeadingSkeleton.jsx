import Skeleton from './Skeleton.jsx';
import { cn } from '../../lib/utils.js';

function SectionHeadingSkeleton({ className }) {
  return (
    <div className={cn('mx-auto max-w-3xl space-y-4 text-center', className)} aria-hidden="true">
      <Skeleton as="span" className="mx-auto block h-3 w-40 rounded-full" />
      <Skeleton as="h2" className="mx-auto h-10 w-3/4 rounded-2xl" />
      <Skeleton as="p" className="mx-auto h-4 w-full max-w-2xl rounded-full" />
    </div>
  );
}

export default SectionHeadingSkeleton;
