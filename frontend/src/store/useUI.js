import { create } from 'zustand';

const THEME_STORAGE_KEY = 'blog:ui:theme';
const SEARCH_STORAGE_KEY = 'blog:ui:last-search';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return prefersDark ? 'dark' : 'light';
};

const getInitialSearch = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const stored = window.localStorage.getItem(SEARCH_STORAGE_KEY);
  if (typeof stored === 'string') {
    return stored;
  }
  return '';
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') {
    return;
  }

  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', theme);
};

const sanitizeSearch = (value = '') => value.toString().trim().toLowerCase();

const sanitizeTags = (tags = []) => {
  const unique = new Set();
  tags
    .filter((tag) => typeof tag === 'string')
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
    .forEach((tag) => unique.add(tag));
  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
};

const initialTheme = getInitialTheme();
const initialSearch = sanitizeSearch(getInitialSearch());

if (typeof document !== 'undefined') {
  applyTheme(initialTheme);
}

export const useUIStore = create((set, get) => ({
  theme: initialTheme,
  search: initialSearch,
  ordering: '-created_at',
  selectedTags: [],
  page: 1,
  setTheme: (nextTheme) => {
    const theme = nextTheme === 'dark' ? 'dark' : 'light';
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
  setSearch: (value) => {
    const sanitized = sanitizeSearch(value);
    if (typeof window !== 'undefined') {
      if (sanitized) {
        window.localStorage.setItem(SEARCH_STORAGE_KEY, sanitized);
      } else {
        window.localStorage.removeItem(SEARCH_STORAGE_KEY);
      }
    }
    set({ search: sanitized, page: 1 });
  },
  setOrdering: (ordering) => {
    set({ ordering: ordering || '-created_at', page: 1 });
  },
  setSelectedTags: (tags) => {
    set({ selectedTags: sanitizeTags(tags), page: 1 });
  },
  toggleTag: (tag) => {
    if (!tag) {
      return;
    }
    const sanitized = tag.trim().toLowerCase();
    set((state) => {
      const current = new Set(state.selectedTags);
      if (current.has(sanitized)) {
        current.delete(sanitized);
      } else {
        current.add(sanitized);
      }
      return { selectedTags: Array.from(current).sort((a, b) => a.localeCompare(b, 'es')), page: 1 };
    });
  },
  setPage: (page) => {
    set({ page: Math.max(1, page || 1) });
  },
  resetFilters: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(SEARCH_STORAGE_KEY);
    }
    set({ search: '', ordering: '-created_at', selectedTags: [], page: 1 });
  }
}));

export const selectTheme = (state) => state.theme;
export const selectIsDark = (state) => state.theme === 'dark';
export const selectSearch = (state) => state.search;
export const selectOrdering = (state) => state.ordering;
export const selectSelectedTags = (state) => state.selectedTags;
export const selectPage = (state) => state.page;
