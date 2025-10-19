import { twMerge } from 'tailwind-merge';

function toClassName(value) {
  if (!value) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(toClassName).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([className]) => className)
      .join(' ');
  }

  return '';
}

export function cn(...inputs) {
  return twMerge(inputs.map(toClassName).filter(Boolean).join(' '));
}
