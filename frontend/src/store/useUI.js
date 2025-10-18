import { create } from 'zustand';

const THEME_STORAGE_KEY = 'blog:ui:theme';
const LEGACY_THEME_KEYS = ['blog-theme-preference'];
const SEARCH_STORAGE_KEY = 'blog:ui:last-search';
const FLOWBITE_THEME_STORAGE_KEY = 'flowbite-theme-mode';
const FLOWBITE_THEME_SYNC_EVENT = 'flowbite-theme-mode-sync';

const safeStorage = {
  get: (key) => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set: (key, value) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Ignorar errores de almacenamiento (modo incógnito, espacio lleno, etc.).
    }
  },
  remove: (key) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      // Ignorar errores al limpiar almacenamiento.
    }
  }
};

const resolveSystemTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
  return prefersDark ? 'dark' : 'light';
};

const getInitialTheme = () => {
  const stored = safeStorage.get(THEME_STORAGE_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  for (const legacyKey of LEGACY_THEME_KEYS) {
    const legacyValue = safeStorage.get(legacyKey);
    if (legacyValue === 'dark' || legacyValue === 'light') {
      safeStorage.set(THEME_STORAGE_KEY, legacyValue);
      return legacyValue;
    }
  }

  return resolveSystemTheme();
};

const getInitialSearch = () => {
  const stored = safeStorage.get(SEARCH_STORAGE_KEY);
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

  safeStorage.set(FLOWBITE_THEME_STORAGE_KEY, theme);

  if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
    try {
      const event = new CustomEvent(FLOWBITE_THEME_SYNC_EVENT, { detail: theme });
      document.dispatchEvent(event);
    } catch (error) {
      // Ignorar errores al sincronizar con Flowbite.
    }
  }
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

const sanitizeCategoryValue = (category) => {
  if (category == null) {
    return null;
  }
  const slug = category.toString().trim().toLowerCase();
  return slug || null;
};

const normalizeOrderingValue = (ordering) => {
  if (ordering == null) {
    return '-date';
  }
  const value = ordering.toString().trim();
  if (!value) {
    return '-date';
  }
  if (value.includes('created_at')) {
    return value.replace(/created_at/g, 'date');
  }
  if (['-date', 'date', 'title', '-title'].includes(value)) {
    return value;
  }
  return '-date';
};

const initialTheme = getInitialTheme();
const initialSearch = sanitizeSearch(getInitialSearch());

let themeListenersInitialized = false;

const initializeThemeListeners = (set) => {
  if (typeof window === 'undefined' || themeListenersInitialized) {
    return;
  }

  themeListenersInitialized = true;
  const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

  const handleMediaChange = (event) => {
    const storedTheme = safeStorage.get(THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return;
    }
    const theme = event.matches ? 'dark' : 'light';
    applyTheme(theme);
    set({ theme });
  };

  const handleStorageChange = (event) => {
    if (event.key !== THEME_STORAGE_KEY) {
      return;
    }

    const nextTheme = event.newValue === 'dark' ? 'dark' : event.newValue === 'light' ? 'light' : resolveSystemTheme();
    applyTheme(nextTheme);
    set({ theme: nextTheme });
  };

  if (mediaQuery) {
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleMediaChange);
    }
  }

  window.addEventListener('storage', handleStorageChange);
};

if (typeof document !== 'undefined') {
  applyTheme(initialTheme);
}

export const useUIStore = create((set, get) => {
  initializeThemeListeners(set);

  return {
    theme: initialTheme,
    search: initialSearch,
    ordering: '-date',
    selectedTags: [],
    selectedCategory: null,
    page: 1,
    setTheme: (nextTheme) => {
      const theme = nextTheme === 'dark' ? 'dark' : 'light';
      safeStorage.set(THEME_STORAGE_KEY, theme);
      LEGACY_THEME_KEYS.forEach((key) => safeStorage.set(key, theme));
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
      if (sanitized) {
        safeStorage.set(SEARCH_STORAGE_KEY, sanitized);
      } else {
        safeStorage.remove(SEARCH_STORAGE_KEY);
      }
      set({ search: sanitized, page: 1 });
    },
    setOrdering: (ordering) => {
      set({ ordering: normalizeOrderingValue(ordering), page: 1 });
    },
    setSelectedTags: (tags) => {
      set({ selectedTags: sanitizeTags(tags), page: 1 });
    },
    setSelectedCategory: (category) => {
      set({ selectedCategory: sanitizeCategoryValue(category), page: 1 });
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
      safeStorage.remove(SEARCH_STORAGE_KEY);
      set({ search: '', ordering: '-created_at', selectedTags: [], selectedCategory: null, page: 1 });
    }
  };
});

export const selectTheme = (state) => state.theme;
export const selectIsDark = (state) => state.theme === 'dark';
export const selectSearch = (state) => state.search;
export const selectOrdering = (state) => state.ordering;
export const selectSelectedTags = (state) => state.selectedTags;
export const selectSelectedCategory = (state) => state.selectedCategory;
export const selectPage = (state) => state.page;
