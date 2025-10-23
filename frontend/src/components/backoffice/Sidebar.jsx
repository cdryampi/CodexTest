import { Fragment, useMemo } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button.jsx';
import IfRole from '../rbac/IfRole.jsx';

function Sidebar({ items, collapsed, onToggleCollapse, mobileOpen, onCloseMobile, activePath }) {
  const desktopWidth = collapsed ? 88 : 280;

  const navItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        isActive: item.match(activePath)
      })),
    [activePath, items]
  );

  const renderNav = (isMobile = false) => (
    <nav className="flex flex-1 flex-col gap-2" aria-label="Secciones del panel">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <IfRole key={item.key} roles={item.allowedRoles}>
            <NavLink
              to={item.to}
              onClick={isMobile ? onCloseMobile : undefined}
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
                  isActive
                    ? 'bg-sky-500/10 text-sky-600 dark:bg-sky-400/10 dark:text-sky-300'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-white'
                ].join(' ')
              }
              title={collapsed && !isMobile ? item.label : undefined}
              end
            >
              <Icon className="h-4 w-4 flex-none" aria-hidden="true" />
              <span className={collapsed && !isMobile ? 'sr-only' : 'truncate'}>{item.label}</span>
            </NavLink>
          </IfRole>
        );
      })}
    </nav>
  );

  return (
    <Fragment>
      <motion.aside
        initial={false}
        animate={{ width: desktopWidth }}
        className="sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/70 bg-white/80 px-4 pb-6 pt-8 shadow-sm backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/60 lg:flex"
      >
        <div className="flex h-full w-full flex-col gap-6">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-3 py-2 shadow-sm dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/40 dark:bg-sky-400">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className={collapsed ? 'hidden' : 'flex flex-col'}>
                <span className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">Backoffice</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">Panel editorial</span>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
              className="h-9 w-9 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" aria-hidden="true" /> : <ChevronLeft className="h-4 w-4" aria-hidden="true" />}
            </Button>
          </div>
          {renderNav(false)}
        </div>
      </motion.aside>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div className="fixed inset-0 z-50 flex lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="relative z-50 flex w-[18rem] flex-col border-r border-slate-200 bg-white px-4 pb-6 pt-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/40 dark:bg-sky-400">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight text-slate-900 dark:text-white">Backoffice</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">Panel editorial</span>
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                  onClick={onCloseMobile}
                  aria-label="Cerrar navegación"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              {renderNav(true)}
            </motion.div>
            <motion.button
              type="button"
              aria-label="Cerrar navegación"
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
              onClick={onCloseMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Fragment>
  );
}

Sidebar.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      to: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
      match: PropTypes.func.isRequired,
      allowedRoles: PropTypes.arrayOf(PropTypes.string)
    })
  ).isRequired,
  collapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  mobileOpen: PropTypes.bool.isRequired,
  onCloseMobile: PropTypes.func.isRequired,
  activePath: PropTypes.string.isRequired
};

export default Sidebar;
