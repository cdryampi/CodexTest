const easeOutExpo = [0.16, 1, 0.3, 1];

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOutExpo
    }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: easeOutExpo
    }
  }
};

export const slideFadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: easeOutExpo
    }
  }
};

export const createStagger = (stagger = 0.12, delayChildren = 0) => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: Math.max(0, Number.isFinite(stagger) ? stagger : 0.12),
      delayChildren: Math.max(0, Number.isFinite(delayChildren) ? delayChildren : 0)
    }
  }
});

export const hoverLift = {
  whileHover: { y: -4 },
  whileTap: { y: -1 }
};

export const inViewProps = (amount = 0.2) => ({
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount }
});

export default {
  fadeInUp,
  fadeIn,
  slideFadeUp,
  createStagger,
  hoverLift,
  inViewProps
};
