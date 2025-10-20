export function prefersReducedMotion() {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (error) {
    if (import.meta.env?.DEV) {
      console.warn('No se pudo evaluar prefers-reduced-motion.', error);
    }
    return false;
  }
}
