const DEFAULT_API_BASE_URL = 'https://backendblog.yampi.eu/api/';
const DEV_FALLBACK_BASE_URL = '/api/';

const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`);

const ensureApiSegment = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') {
    return '';
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return '';
  }

  const isAbsolute = /^https?:\/\//i.test(trimmed);

  if (isAbsolute) {
    const url = new URL(ensureTrailingSlash(trimmed));
    const pathname = url.pathname || '/';
    if (/\/api\/?$/i.test(pathname) || pathname.toLowerCase().includes('/api/')) {
      url.pathname = ensureTrailingSlash(pathname);
    } else {
      url.pathname = ensureTrailingSlash(`${pathname.replace(/\/$/, '')}/api`);
    }
    return url.toString();
  }

  const segments = trimmed.split('/').filter(Boolean);
  const hasApiSegment = segments.some((segment) => segment.toLowerCase() === 'api');
  if (!hasApiSegment) {
    segments.push('api');
  }
  return `/${segments.join('/')}/`;
};

export const resolveApiBaseUrl = () => {
  const envBase = import.meta.env?.VITE_API_BASE_URL;
  if (typeof envBase === 'string' && envBase.trim()) {
    return ensureApiSegment(envBase);
  }

  if (typeof window !== 'undefined') {
    const runtimeBase = window.__ENV__?.API_BASE_URL;
    if (typeof runtimeBase === 'string' && runtimeBase.trim()) {
      return ensureApiSegment(runtimeBase);
    }
  }

  if (import.meta.env?.DEV) {
    return ensureApiSegment(DEV_FALLBACK_BASE_URL);
  }

  return ensureApiSegment(DEFAULT_API_BASE_URL);
};

export const API_BASE_URL = resolveApiBaseUrl();

