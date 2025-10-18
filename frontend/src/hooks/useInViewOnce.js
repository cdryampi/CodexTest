import { useEffect, useRef, useState } from 'react';

function useInViewOnce(options = {}) {
  const elementRef = useRef(null);
  const observerRef = useRef(null);
  const optionsRef = useRef(options);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (inView) {
      return undefined;
    }

    const node = elementRef.current;
    if (!node) {
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return undefined;
    }

    observerRef.current = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      }
    }, optionsRef.current);

    observerRef.current.observe(node);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [inView]);

  return [elementRef, inView];
}

export default useInViewOnce;
