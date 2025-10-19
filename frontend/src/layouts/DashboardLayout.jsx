import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  Users,
  Tags,
  Layers
} from 'lucide-react';
import Sidebar from '../components/backoffice/Sidebar.jsx';
import Topbar from '../components/backoffice/Topbar.jsx';
import {
  useDashboardStore,
  selectDashboardSidebarCollapsed,
  selectDashboardMobileSidebarOpen
} from '../store/dashboard.js';

const DashboardLayoutContext = createContext(null);

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext);
  if (!context) {
    throw new Error('useDashboardLayout debe utilizarse dentro de <DashboardLayout />.');
  }
  return context;
}

const NAVIGATION_ITEMS = [
  {
    key: 'overview',
    section: null,
    label: 'Resumen',
    description: 'Una mirada rápida al desempeño del contenido.',
    to: '/dashboard',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/dashboard',
    showSearch: false,
    searchPlaceholder: 'Buscar en el panel'
  },
  {
    key: 'posts',
    section: 'posts',
    label: 'Posts',
    description: 'Gestiona publicaciones, estados y etiquetas.',
    to: '/dashboard/posts',
    icon: FileText,
    match: (pathname) => pathname.startsWith('/dashboard/posts'),
    showSearch: true,
    searchPlaceholder: 'Buscar posts por título, tag o categoría'
  },
  {
    key: 'tags',
    section: 'tags',
    label: 'Etiquetas',
    description: 'Organiza etiquetas y evita duplicados.',
    to: '/dashboard/tags',
    icon: Tags,
    match: (pathname) => pathname.startsWith('/dashboard/tags'),
    showSearch: true,
    searchPlaceholder: 'Buscar etiquetas por nombre'
  },
  {
    key: 'categories',
    section: 'categories',
    label: 'Categorías',
    description: 'Agrupa tus posts por temática.',
    to: '/dashboard/categories',
    icon: Layers,
    match: (pathname) => pathname.startsWith('/dashboard/categories'),
    showSearch: true,
    searchPlaceholder: 'Buscar categorías por nombre'
  },
  {
    key: 'comments',
    section: 'comments',
    label: 'Comentarios',
    description: 'Modera y responde a la comunidad.',
    to: '/dashboard/comments',
    icon: MessageSquare,
    match: (pathname) => pathname.startsWith('/dashboard/comments'),
    showSearch: true,
    searchPlaceholder: 'Buscar comentarios por autor o contenido'
  },
  {
    key: 'users',
    section: null,
    label: 'Usuarios',
    description: 'Controla roles y accesos del equipo.',
    to: '/dashboard/users',
    icon: Users,
    match: (pathname) => pathname.startsWith('/dashboard/users'),
    showSearch: false,
    searchPlaceholder: 'Buscar en el panel'
  },
  {
    key: 'settings',
    section: null,
    label: 'Ajustes',
    description: 'Preferencias del panel y personalización.',
    to: '/dashboard/settings',
    icon: Settings,
    match: (pathname) => pathname.startsWith('/dashboard/settings'),
    showSearch: false,
    searchPlaceholder: 'Buscar en el panel'
  }
];

const resolveActiveItem = (pathname) =>
  NAVIGATION_ITEMS.find((item) => item.match(pathname)) ?? NAVIGATION_ITEMS[0];

function DashboardLayout() {
  const location = useLocation();
  const sidebarCollapsed = useDashboardStore(selectDashboardSidebarCollapsed);
  const toggleSidebarCollapsed = useDashboardStore((state) => state.toggleSidebarCollapsed);
  const mobileSidebarOpen = useDashboardStore(selectDashboardMobileSidebarOpen);
  const openMobileSidebar = useDashboardStore((state) => state.openMobileSidebar);
  const closeMobileSidebar = useDashboardStore((state) => state.closeMobileSidebar);
  const setSectionSearch = useDashboardStore((state) => state.setSectionSearch);

  const activeItem = useMemo(() => resolveActiveItem(location.pathname), [location.pathname]);
  const sectionKey = activeItem.section;

  const sectionSearch = useDashboardStore(
    useCallback(
      (state) => (sectionKey ? state.sections?.[sectionKey]?.search ?? '' : ''),
      [sectionKey]
    )
  );

  const [header, setHeader] = useState(() => ({
    title: activeItem.label,
    description: activeItem.description,
    actions: null,
    showSearch: Boolean(activeItem.showSearch),
    searchPlaceholder: activeItem.searchPlaceholder ?? 'Buscar en el panel'
  }));

  useEffect(() => {
    setHeader({
      title: activeItem.label,
      description: activeItem.description,
      actions: null,
      showSearch: Boolean(activeItem.showSearch),
      searchPlaceholder: activeItem.searchPlaceholder ?? 'Buscar en el panel'
    });
  }, [activeItem]);

  useEffect(() => {
    if (!mobileSidebarOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMobileSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMobileSidebar, mobileSidebarOpen]);

  const handleSearchChange = useCallback(
    (value) => {
      if (!sectionKey) {
        return;
      }
      setSectionSearch(sectionKey, value);
    },
    [sectionKey, setSectionSearch]
  );

  const contextValue = useMemo(
    () => ({
      setHeader: (values) => {
        setHeader((prev) => ({
          ...prev,
          ...values,
          searchPlaceholder: values?.searchPlaceholder ?? prev.searchPlaceholder
        }));
      },
      header,
      sidebarCollapsed,
      toggleSidebarCollapsed,
      openMobileSidebar,
      closeMobileSidebar,
      searchValue: sectionSearch,
      onSearchChange: handleSearchChange,
      sectionKey
    }),
    [closeMobileSidebar, handleSearchChange, header, openMobileSidebar, sectionKey, sectionSearch, sidebarCollapsed, toggleSidebarCollapsed]
  );

  return (
    <DashboardLayoutContext.Provider value={contextValue}>
      <div className="flex min-h-screen w-full bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Sidebar
          items={NAVIGATION_ITEMS}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
          activePath={location.pathname}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar
            title={header.title}
            description={header.description}
            actions={header.actions}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapsed}
            onOpenMobile={openMobileSidebar}
            showSearch={header.showSearch && Boolean(sectionKey)}
            searchValue={sectionSearch}
            onSearchChange={handleSearchChange}
            searchPlaceholder={header.searchPlaceholder}
          />
          <main className="relative flex-1 overflow-y-auto px-4 pb-12 pt-6 sm:px-6 lg:px-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="mx-auto w-full max-w-6xl"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </DashboardLayoutContext.Provider>
  );
}

export default DashboardLayout;
