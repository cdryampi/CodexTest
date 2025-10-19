import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const sanitizeSearch = (value) => (value || '').toString().trim().toLowerCase();

const sanitizeTags = (tags) => {
  if (!Array.isArray(tags)) {
    return [];
  }
  const unique = new Set();
  tags.forEach((tag) => {
    if (typeof tag === 'string') {
      const normalized = tag.trim().toLowerCase();
      if (normalized) {
        unique.add(normalized);
      }
    }
  });
  return Array.from(unique);
};

const storage = createJSONStorage(() => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.localStorage;
});

export const useDashboardStore = create(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      density: 'comfortable',
      search: '',
      statusFilter: 'all',
      tagFilter: [],
      pageIndex: 0,
      pageSize: 8,
      sortBy: 'publishedAt',
      sortDirection: 'desc',
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: Boolean(collapsed) }),
      toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      openMobileSidebar: () => set({ mobileSidebarOpen: true }),
      closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
      setDensity: (density) => set({ density: density === 'compact' ? 'compact' : 'comfortable' }),
      setSearch: (value) => set({ search: sanitizeSearch(value), pageIndex: 0 }),
      setStatusFilter: (status) => set({ statusFilter: status || 'all', pageIndex: 0 }),
      setTagFilter: (tags) => set({ tagFilter: sanitizeTags(tags), pageIndex: 0 }),
      resetFilters: () => set({ search: '', statusFilter: 'all', tagFilter: [], pageIndex: 0 }),
      setPagination: ({ pageIndex, pageSize }) => {
        const nextPageIndex = Number.isFinite(pageIndex) && pageIndex >= 0 ? pageIndex : get().pageIndex;
        const nextPageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : get().pageSize;
        set({ pageIndex: nextPageIndex, pageSize: nextPageSize });
      },
      setSort: ({ sortBy, sortDirection }) => {
        const nextSortBy = typeof sortBy === 'string' && sortBy ? sortBy : get().sortBy;
        const nextDirection = sortDirection === 'asc' ? 'asc' : 'desc';
        set({ sortBy: nextSortBy, sortDirection: nextDirection });
      }
    }),
    {
      name: 'dashboard:ui',
      storage,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        density: state.density,
        search: state.search,
        statusFilter: state.statusFilter,
        tagFilter: state.tagFilter,
        pageSize: state.pageSize,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection
      })
    }
  )
);

export const selectDashboardSearch = (state) => state.search;
export const selectDashboardStatusFilter = (state) => state.statusFilter;
export const selectDashboardTagFilter = (state) => state.tagFilter;
export const selectDashboardDensity = (state) => state.density;
export const selectDashboardSidebarCollapsed = (state) => state.sidebarCollapsed;
export const selectDashboardMobileSidebarOpen = (state) => state.mobileSidebarOpen;
export const selectDashboardPagination = (state) => ({
  pageIndex: state.pageIndex,
  pageSize: state.pageSize
});
export const selectDashboardSorting = (state) => ({
  sortBy: state.sortBy,
  sortDirection: state.sortDirection
});
