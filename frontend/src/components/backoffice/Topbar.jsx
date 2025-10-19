import { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, LogOut, Settings2, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../ui/theme-toggle.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar.jsx';

function Topbar({
  title,
  description,
  actions,
  collapsed,
  onToggleCollapse,
  onOpenMobile,
  showSearch,
  searchValue,
  onSearchChange,
  searchPlaceholder
}) {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const displayName = useMemo(() => {
    if (!user) return '';
    if (user.first_name || user.last_name) {
      return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
    }
    if (user.username) return user.username;
    return user.email ?? '';
  }, [user]);

  const avatarInitials = useMemo(() => {
    const base = displayName || user?.email || '?';
    return base.slice(0, 2).toUpperCase();
  }, [displayName, user?.email]);

  useEffect(() => {
    if (!showSearch) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      const target = event.target;
      const isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (!isEditable && event.key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSearch]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchInput = (event) => {
    onSearchChange(event.target.value);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-colors duration-200 dark:border-slate-800/70 dark:bg-slate-950/70">
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-start gap-3 lg:items-center">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="mt-1 inline-flex lg:hidden"
              onClick={onOpenMobile}
              aria-label="Abrir navegación"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden h-9 w-9 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white lg:inline-flex"
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
                >
                  <span className="sr-only">Alternar barra lateral</span>
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
              {description ? (
                <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{description}</p>
              ) : null}
            </motion.div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {actions}
            <ThemeToggle className="hidden lg:inline-flex" />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-3 rounded-full border border-transparent px-2 py-1.5 text-sm font-semibold text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Avatar className="h-9 w-9">
                      {user?.avatar ? (
                        <AvatarImage src={user.avatar} alt={displayName || 'Perfil de usuario'} />
                      ) : null}
                      <AvatarFallback>{avatarInitials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[12rem] truncate text-left sm:block">{displayName || user?.email || 'Cuenta'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={12} className="w-60">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Sesión activa</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{displayName || 'Usuario'}</span>
                    {user?.email ? <span className="text-xs text-slate-400 dark:text-slate-500">{user.email}</span> : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={(event) => event.preventDefault()} className="cursor-default text-xs text-slate-400">
                    Panel editorial en desarrollo
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleLogout();
                    }}
                    className="text-red-600 focus-visible:bg-red-50 focus-visible:text-red-700 dark:text-red-400 dark:focus-visible:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
        {showSearch ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input
                ref={searchRef}
                type="search"
                value={searchValue}
                onChange={handleSearchInput}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full rounded-full border-slate-200 bg-white pl-10 pr-4 text-sm dark:border-slate-800 dark:bg-slate-900"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500 sm:inline-flex">
                /
              </span>
            </div>
            <ThemeToggle className="inline-flex sm:hidden" />
          </div>
        ) : null}
      </div>
    </header>
  );
}

Topbar.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.node,
  actions: PropTypes.node,
  collapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
  onOpenMobile: PropTypes.func.isRequired,
  showSearch: PropTypes.bool,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  searchPlaceholder: PropTypes.string
};

Topbar.defaultProps = {
  description: null,
  actions: null,
  showSearch: false,
  searchValue: '',
  searchPlaceholder: 'Buscar en el panel'
};

export default Topbar;
