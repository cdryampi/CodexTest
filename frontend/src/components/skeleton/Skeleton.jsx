import { forwardRef, useEffect, useState } from 'react';
import { cn } from '../../lib/utils.js';
import { prefersReducedMotion } from '../../lib/motion-prefs.js';

const Skeleton = forwardRef(function Skeleton(
  { as: Component = 'div', className, ...rest },
  ref
) {
  const [reducedMotion, setReducedMotion] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleChange = (event) => {
      setReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const props = { ...rest };
  const ariaHidden = Object.prototype.hasOwnProperty.call(props, 'aria-hidden')
    ? props['aria-hidden']
    : true;

  if (Object.prototype.hasOwnProperty.call(props, 'aria-hidden')) {
    delete props['aria-hidden'];
  }

  return (
    <Component
      ref={ref}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      className={cn(
        'relative isolate overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800',
        !reducedMotion && 'skeleton-shimmer',
        className
      )}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
});

export default Skeleton;
