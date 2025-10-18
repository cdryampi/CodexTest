import { useEffect, useState } from 'react';

const clamp = (value, min = 0, max = 100) => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(value, min), max);
};

const getScrollProgress = () => {
  if (typeof document === 'undefined') {
    return 0;
  }
  const { documentElement } = document;
  if (!documentElement) {
    return 0;
  }

  const { scrollTop, scrollHeight, clientHeight } = documentElement;
  const total = scrollHeight - clientHeight;
  if (total <= 0) {
    return 100;
  }

  return clamp((scrollTop / total) * 100);
};

function ReadingProgress() {
  const [progress, setProgress] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    let animationFrame = null;

    const updateProgress = () => {
      animationFrame = null;
      setProgress(getScrollProgress());
    };

    const handleScroll = () => {
      if (animationFrame !== null) {
        return;
      }
      animationFrame = window.requestAnimationFrame(updateProgress);
    };

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleMotionPreferenceChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    setPrefersReducedMotion(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMotionPreferenceChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleMotionPreferenceChange);
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    handleScroll();

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);

      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMotionPreferenceChange);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleMotionPreferenceChange);
      }
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-transparent">
      <div
        className={`h-full origin-left bg-sky-500 transition-[transform] ${
          prefersReducedMotion ? '' : 'duration-200 ease-out'
        } dark:bg-sky-400`}
        style={{ transform: `scaleX(${progress / 100})` }}
        aria-hidden="true"
      />
    </div>
  );
}

export default ReadingProgress;
