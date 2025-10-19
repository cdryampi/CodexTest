import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, FileText, MessageSquare, Users, Settings } from 'lucide-react';
import Sidebar from '../components/backoffice/Sidebar.jsx';
import Topbar from '../components/backoffice/Topbar.jsx';
import { useDashboardStore } from '../store/dashboard.js';

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
    label: 'Resumen',
    description: 'Una mirada rápida al desempeño del contenido.',
    to: '/dashboard',
    icon: LayoutDashboard,
    match: (pathname) => pathname === '/dashboard',
    showSearch: false
  },
  {
    key: 'posts',
    label: 'Posts',
    description: 'Gestiona publicaciones, estados y etiquetas.',
    to: '/dashboard/posts',
    icon: FileText,
    match: (pathname) => pathname.startsWith('/dashboard/posts'),
    showSearch: true
  },
  {
    key: 'comments',
    label: 'Comentarios',
    description: 'Modera y responde a la comunidad.',
    to: '/dashboard/comments',
    icon: MessageSquare,
    match: (pathname) => pathname.startsWith('/dashboard/comments'),
    showSearch: false
  },
  {
    key: 'users',
    label: 'Usuarios',
    description: 'Controla roles y accesos del equipo.',
    to: '/dashboard/users',
    icon: Users,
    match: (pathname) => pathname.startsWith('/dashboard/users'),
    showSearch: false
  },
  {
    key: 'settings',
    label: 'Ajustes',
    description: 'Preferencias del panel y personalización.',
    to: '/dashboard/settings',
    icon: Settings,
    match: (pathname) => pathname.startsWith('/dashboard/settings'),
    showSearch: false
  }
];

function DashboardLayout() {
  const location = useLocation();
  const sidebarCollapsed = useDashboardStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useDashboardStore((state) => state.setSidebarCollapsed);
  const toggleSidebarCollapsed = useDashboardStore((state) => state.toggleSidebarCollapsed);
  const mobileSidebarOpen = useDashboardStore((state) => state.mobileSidebarOpen);
  const openMobileSidebar = useDashboardStore((state) => state.openMobileSidebar);
  const closeMobileSidebar = useDashboardStore((state) => state.closeMobileSidebar);
  const searchValue = useDashboardStore((state) => state.search);
  const setSearch = useDashboardStore((state) => state.setSearch);

  const [header, setHeader] = useState(() => ({
    title: 'Resumen',
    description: 'Una mirada rápida al desempeño del contenido.',
    actions: null,
    showSearch: false
  }));

  const activeItem = useMemo(() => {
    return (
      NAVIGATION_ITEMS.find((item) => item.match(location.pathname)) ?? NAVIGATION_ITEMS[0]
    );
  }, [location.pathname]);

  useEffect(() => {
    setHeader({
      title: activeItem.label,
      description: activeItem.description,
      actions: null,
      showSearch: Boolean(activeItem.showSearch)
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
      setSearch(value);
    },
    [setSearch]
  );

  const contextValue = useMemo(
    () => ({
      setHeader: (values) => {
        setHeader((prev) => ({ ...prev, ...values }));
      },
      header,
      sidebarCollapsed,
      setSidebarCollapsed,
      toggleSidebarCollapsed,
      openMobileSidebar,
      closeMobileSidebar,
      searchValue,
      setSearch: handleSearchChange
    }),
    [closeMobileSidebar, handleSearchChange, header, openMobileSidebar, setSidebarCollapsed, sidebarCollapsed, toggleSidebarCollapsed, searchValue]
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
            showSearch={header.showSearch}
            searchValue={searchValue}
            onSearchChange={handleSearchChange}
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
