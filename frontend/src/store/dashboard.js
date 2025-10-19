import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const sanitizeSearch = (value) => (value || '').toString().trim();

const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }
  const unique = new Set();
  tags.forEach((tag) => {
    if (typeof tag !== 'string') return;
    const normalized = tag.trim();
    if (normalized) {
      unique.add(normalized);
    }
  });
  return Array.from(unique);
};

const sanitizePostsStatus = (value) => {
  if (['all', 'published', 'scheduled', 'draft'].includes(value)) {
    return value;
  }
  return 'all';
};

const sanitizeOrdering = (value, fallback) => {
  const allowed = ['-date', 'date', '-created_at', 'created_at', '-title', 'title'];
  if (allowed.includes(value)) {
    return value;
  }
  return fallback;
};

const sanitizePage = (value, fallback = 1) => {
  const number = Number.parseInt(value, 10);
  if (Number.isFinite(number) && number > 0) {
    return number;
  }
  return fallback;
};

const sanitizePageSize = (value, fallback = 10) => {
  const number = Number.parseInt(value, 10);
  if (Number.isFinite(number) && number > 0 && number <= 100) {
    return number;
  }
  return fallback;
};

const createDefaultSections = () => ({
  posts: {
    search: '',
    status: 'all',
    ordering: '-date',
    page: 1,
    pageSize: 10,
    tags: [],
    category: ''
  },
  tags: {
    search: '',
    ordering: 'name',
    page: 1,
    pageSize: 20
  },
  categories: {
    search: '',
    ordering: 'name',
    page: 1,
    pageSize: 20
  },
  comments: {
    search: '',
    ordering: '-created_at',
    page: 1,
    pageSize: 15,
    status: 'all',
    postSlug: ''
  }
});

const SECTION_DEFAULTS = createDefaultSections();

const storage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.localStorage;
});

const cloneSection = (sectionKey) => ({ ...SECTION_DEFAULTS[sectionKey] });

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      density: 'comfortable',
      sections: createDefaultSections(),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: Boolean(collapsed) }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      setDensity: (density) => set({ density: density === 'compact' ? 'compact' : 'comfortable' }),
      resetAllSections: () => set({ sections: createDefaultSections() }),
      setSectionSearch: (sectionKey, value) => {
        const currentSections = get().sections;
        if (!currentSections?.[sectionKey]) {
          return;
        }
        set({
          sections: {
            ...currentSections,
            [sectionKey]: {
              ...currentSections[sectionKey],
              search: sanitizeSearch(value),
              page: 1
            }
          }
        });
      },
      updateSection: (sectionKey, partialState) => {
        const currentSections = get().sections;
        if (!currentSections?.[sectionKey]) {
          return;
        }
        set({
          sections: {
            ...currentSections,
            [sectionKey]: {
              ...currentSections[sectionKey],
              ...partialState
            }
          }
        });
      },
      resetSection: (sectionKey) => {
        const currentSections = get().sections;
        if (!currentSections?.[sectionKey]) {
          return;
        }
        set({
          sections: {
            ...currentSections,
            [sectionKey]: cloneSection(sectionKey)
          }
        });
      },
      setPostsFilters: (partial) => {
        const currentSections = get().sections;
        const current = currentSections.posts;
        const next = {
          ...current,
          status: partial.status ? sanitizePostsStatus(partial.status) : current.status,
          ordering: partial.ordering ? sanitizeOrdering(partial.ordering, current.ordering) : current.ordering,
          category: typeof partial.category === 'string' ? partial.category : current.category,
          tags: partial.tags ? sanitizeTags(partial.tags) : current.tags,
          page: partial.page ? sanitizePage(partial.page, current.page) : current.page,
          pageSize: partial.pageSize ? sanitizePageSize(partial.pageSize, current.pageSize) : current.pageSize
        };
        if (typeof partial.search === 'string') {
          next.search = sanitizeSearch(partial.search);
        }
        set({
          sections: {
            ...currentSections,
            posts: next
          }
        });
      },
      setPostsStatus: (status) => {
        const currentSections = get().sections;
        const current = currentSections.posts;
        set({
          sections: {
            ...currentSections,
            posts: {
              ...current,
              status: sanitizePostsStatus(status),
              page: 1
            }
          }
        });
      },
      setPostsOrdering: (ordering) => {
        const currentSections = get().sections;
        const current = currentSections.posts;
        set({
          sections: {
            ...currentSections,
            posts: {
              ...current,
              ordering: sanitizeOrdering(ordering, current.ordering)
            }
          }
        });
      },
      setPostsPagination: ({ page, pageSize }) => {
        const currentSections = get().sections;
        const current = currentSections.posts;
        set({
          sections: {
            ...currentSections,
            posts: {
              ...current,
              page: sanitizePage(page, current.page),
              pageSize: sanitizePageSize(pageSize, current.pageSize)
            }
          }
        });
      },
      setPostsCategory: (category) => {
        const currentSections = get().sections;
        const current = currentSections.posts;
        set({
          sections: {
            ...currentSections,
            posts: {
              ...current,
              category: typeof category === 'string' ? category : '',
              page: 1
            }
          }
        });
      },
      setPostsTags: (tags) => {
        const currentSections = get().sections;
        const current = currentSections.posts;
        set({
          sections: {
            ...currentSections,
            posts: {
              ...current,
              tags: sanitizeTags(tags),
              page: 1
            }
          }
        });
      },
      resetPosts: () => {
        const currentSections = get().sections;
        set({
          sections: {
            ...currentSections,
            posts: cloneSection('posts')
          }
        });
      },
      setCommentsFilters: (partial) => {
        const currentSections = get().sections;
        const current = currentSections.comments;
        const next = {
          ...current,
          search: typeof partial.search === 'string' ? sanitizeSearch(partial.search) : current.search,
          ordering: partial.ordering ?? current.ordering,
          page: partial.page ? sanitizePage(partial.page, current.page) : current.page,
          pageSize: partial.pageSize ? sanitizePageSize(partial.pageSize, current.pageSize) : current.pageSize,
          status: partial.status ? sanitizePostsStatus(partial.status) : current.status,
          postSlug: typeof partial.postSlug === 'string' ? partial.postSlug : current.postSlug
        };
        set({
          sections: {
            ...currentSections,
            comments: next
          }
        });
      },
      resetComments: () => {
        const currentSections = get().sections;
        set({
          sections: {
            ...currentSections,
            comments: cloneSection('comments')
          }
        });
      },
      setTagSearch: (value) => {
        const currentSections = get().sections;
        const current = currentSections.tags;
        set({
          sections: {
            ...currentSections,
            tags: {
              ...current,
              search: sanitizeSearch(value),
              page: 1
            }
          }
        });
      },
      resetTags: () => {
        const currentSections = get().sections;
        set({
          sections: {
            ...currentSections,
            tags: cloneSection('tags')
          }
        });
      },
      setCategoriesSearch: (value) => {
        const currentSections = get().sections;
        const current = currentSections.categories;
        set({
          sections: {
            ...currentSections,
            categories: {
              ...current,
              search: sanitizeSearch(value),
              page: 1
            }
          }
        });
      },
      resetCategories: () => {
        const currentSections = get().sections;
        set({
          sections: {
            ...currentSections,
            categories: cloneSection('categories')
          }
        });
      }
    }),
    {
      name: 'dashboard:ui',
      storage,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        density: state.density,
        sections: state.sections
      })
    }
  )
);

export const selectDashboardDensity = (state) => state.density;
export const selectDashboardSidebarCollapsed = (state) => state.sidebarCollapsed;
export const selectDashboardMobileSidebarOpen = (state) => state.mobileSidebarOpen;
export const selectPostsState = (state) => state.sections.posts;
export const selectTagsState = (state) => state.sections.tags;
export const selectCategoriesState = (state) => state.sections.categories;
export const selectCommentsState = (state) => state.sections.comments;

export const selectPostsPagination = (state) => ({
  page: state.sections.posts.page,
  pageSize: state.sections.posts.pageSize
});

export const selectPostsFilters = (state) => ({
  status: state.sections.posts.status,
  ordering: state.sections.posts.ordering,
  category: state.sections.posts.category,
  tags: state.sections.posts.tags,
  search: state.sections.posts.search
});

export const selectPostsSearch = (state) => state.sections.posts.search;
export const selectCommentsSearch = (state) => state.sections.comments.search;
