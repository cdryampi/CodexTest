import confetti from 'canvas-confetti';

const DEFAULT_SETTINGS = {
  particleCount: 120,
  spread: 65,
  startVelocity: 45,
  decay: 0.9,
  scalar: 0.9,
  origin: { y: 0.6 }
};

const isBrowser = typeof window !== 'undefined';

export default function launchConfetti(options = {}) {
  if (!isBrowser) {
    return;
  }
  const payload = { ...DEFAULT_SETTINGS, ...options };
  try {
    confetti(payload);
  } catch (error) {
    if (import.meta?.env?.DEV) {
      console.warn('No fue posible disparar el confetti:', error);
    }
  }
}
