import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AlignJustify,
  Bolt,
  Clock3,
  Home,
  LayoutDashboard,
  LayoutList,
  MessageSquare,
  LogIn,
  LogOut,
  NotebookPen,
  Search,
  Tags,
  User,
  UserCircle2,
  UserPlus,
  X
} from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { useAuth } from '../context/AuthContext.jsx';
import useAuthStore from '../store/auth.js';
import { useUIStore, selectIsDark, selectSearch } from '../store/useUI';
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from './ui/navigation-menu.jsx';
import ThemeToggle from './ui/theme-toggle.jsx';
import LanguageSwitcher from './common/LanguageSwitcher.jsx';
import { Button } from './ui/button.jsx';
import { Input } from './ui/input.jsx';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from './ui/dropdown-menu.jsx';
import { cn } from '../lib/utils';
import RoleBadge from './rbac/RoleBadge.jsx';
import Can from './rbac/Can.jsx';

const DASHBOARD_ALLOWED_ROLES = ['admin', 'editor', 'author', 'reviewer'];

const MAIN_LINKS = [
  {
    to: '/',
    labelKey: 'navbar.home',
    icon: Home
  },
  {
    to: '/timeline',
    labelKey: 'navbar.timeline',
    icon: Clock3
  }
];

const DASHBOARD_LINKS = [
  {
    to: '/dashboard',
    labelKey: 'navbar.panel',
    icon: LayoutDashboard,
    match: (path) => path === '/dashboard',
    allowedRoles: DASHBOARD_ALLOWED_ROLES
  },
  {
    to: '/dashboard/posts',
    labelKey: 'navbar.posts',
    icon: NotebookPen,
    match: (path) => path.startsWith('/dashboard/posts'),
    allowedRoles: DASHBOARD_ALLOWED_ROLES
  },
  {
    to: '/dashboard/categories',
    labelKey: 'navbar.categories',
    icon: LayoutList,
    match: (path) => path.startsWith('/dashboard/categories'),
    allowedRoles: DASHBOARD_ALLOWED_ROLES
  },
  {
    to: '/dashboard/tags',
    labelKey: 'navbar.tags',
    icon: Tags,
    match: (path) => path.startsWith('/dashboard/tags'),
    allowedRoles: DASHBOARD_ALLOWED_ROLES
  },
  {
    to: '/dashboard/comments',
    labelKey: 'navbar.comments',
    icon: MessageSquare,
    match: (path) => path.startsWith('/dashboard/comments'),
    allowedRoles: DASHBOARD_ALLOWED_ROLES
  },
  {
    to: '/dashboard/users',
    labelKey: 'navbar.users',
    icon: User,
    match: (path) => path.startsWith('/dashboard/users'),
    allowedRoles: ['admin']
  }
];

const ROLE_PRIORITY = {
  admin: 1,
  editor: 2,
  author: 3,
  reviewer: 4,
  reader: 5
};

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { status: authStatus, roles, fetchMe } = useAuthStore(
    (state) => ({
      status: state.status,
      roles: state.roles,
      fetchMe: state.fetchMe
    }),
    shallow
  );
  const globalSearch = useUIStore(selectSearch);
  const setSearch = useUIStore((state) => state.setSearch);
  const resetFilters = useUIStore((state) => state.resetFilters);
  const isDark = useUIStore(selectIsDark);

  const [localSearch, setLocalSearch] = useState(globalSearch);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useTranslation();
  const mainLinks = useMemo(() => MAIN_LINKS.map((link) => ({ ...link, label: t(link.labelKey) })), [t]);
  const dashboardLinks = useMemo(() =>
    DASHBOARD_LINKS.map((link) => ({ ...link, label: t(link.labelKey) })),
    [t]
  );

  useEffect(() => {
    setLocalSearch(globalSearch);
  }, [globalSearch]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (localSearch !== globalSearch) {
        setSearch(localSearch);
      }
    }, 250);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, globalSearch, setSearch]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    if (authStatus === 'idle') {
      fetchMe().catch(() => {});
    }
  }, [authStatus, fetchMe, isAuthenticated]);

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

  const normalizedRoles = useMemo(
    () => (Array.isArray(roles) ? roles.map((role) => `${role}`.trim()).filter(Boolean) : []),
    [roles]
  );

  const normalizedRolesLower = useMemo(
    () => normalizedRoles.map((role) => role.toLowerCase()),
    [normalizedRoles]
  );

  const primaryRole = useMemo(() => {
    if (!normalizedRoles.length) {
      return null;
    }
    const sorted = [...normalizedRoles].sort((a, b) => {
      const rankA = ROLE_PRIORITY[a.toLowerCase()] ?? 99;
      const rankB = ROLE_PRIORITY[b.toLowerCase()] ?? 99;
      return rankA - rankB;
    });
    return sorted[0] ?? null;
  }, [normalizedRoles]);

  const accessibleDashboardLinks = useMemo(
    () =>
      dashboardLinks.filter((link) => {
        if (!Array.isArray(link.allowedRoles) || link.allowedRoles.length === 0) {
          return true;
        }
        return link.allowedRoles.some((role) => normalizedRolesLower.includes(role));
      }),
    [dashboardLinks, normalizedRolesLower]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleLogoutSelect = async (event) => {
    event?.preventDefault();
    await handleLogout();
  };

  const renderMainLink = (link) => {
    const Icon = link.icon;
    const isActive = location.pathname === link.to;

    return (
      <NavigationMenuItem key={link.to}>
        <NavigationMenuLink asChild active={isActive} className="flex items-center gap-2">
          <Link to={link.to}>
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        </NavigationMenuLink>
      </NavigationMenuItem>
    );
  };

  const quickActions = isAuthenticated ? (
    <Can roles={DASHBOARD_ALLOWED_ROLES}>
      <Button asChild className="hidden lg:inline-flex" size="sm">
        <Link to="/dashboard/posts" className="flex items-center gap-2">
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
          {t('navbar.panel')}
        </Link>
      </Button>
    </Can>
  ) : null;

  const authContent = isAuthenticated ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 rounded-full px-2 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <Avatar className="h-9 w-9">
            {user?.avatar ? (
              <AvatarImage src={user.avatar} alt={displayName || t('navbar.profileAlt')} />
            ) : null}
            <AvatarFallback>{avatarInitials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[10rem] truncate text-left text-sm lg:block">
            {displayName || user?.email || t('navbar.account')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" sideOffset={12}>
        <DropdownMenuLabel className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t('navbar.activeSession')}</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{displayName || t('navbar.userFallback')}</span>
          {user?.email ? <span className="text-xs text-slate-400 dark:text-slate-500">{user.email}</span> : null}
          {primaryRole ? <RoleBadge role={primaryRole} /> : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex w-full items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              {t('navbar.profile')}
            </Link>
          </DropdownMenuItem>
          {accessibleDashboardLinks.map((link) => {
            const Icon = link.icon;
            return (
              <DropdownMenuItem key={link.to} asChild>
                <Link to={link.to} className="flex w-full items-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </Link>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogoutSelect} className="text-red-600 focus-visible:bg-red-50 focus-visible:text-red-700 dark:text-red-400 dark:focus-visible:bg-red-500/10">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t('navbar.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <div className="hidden items-center gap-2 lg:flex">
      <Button variant="ghost" asChild size="sm">
        <Link to="/login" className="flex items-center gap-2">
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {t('navbar.login')}
        </Link>
      </Button>
      <Button variant="outline" asChild size="sm">
        <Link to="/register" className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {t('navbar.register')}
        </Link>
      </Button>
    </div>
  );

  const mobileLinks = isAuthenticated
    ? [
        ...mainLinks,
        { to: '/profile', label: t('navbar.profile'), icon: UserCircle2 },
        ...accessibleDashboardLinks,
        { to: '/logout', label: t('navbar.logout'), icon: LogOut, action: handleLogout }
      ]
    : [
        ...mainLinks,
        { to: '/login', label: t('navbar.login'), icon: LogIn },
        { to: '/register', label: t('navbar.register'), icon: UserPlus }
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 backdrop-blur-lg transition-colors duration-200 dark:border-slate-800/60 dark:bg-slate-950/70">
      <div className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3 text-slate-800 transition hover:opacity-90 dark:text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500 text-white shadow-lg shadow-sky-500/40 dark:bg-sky-400">
            <Bolt className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-bold">React Tailwind Blog</span>
            <span className="text-xs text-slate-400 dark:text-slate-500">{t('navbar.subtitle')}</span>
          </div>
        </Link>
        <div className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          <NavigationMenu>
            <NavigationMenuList>
              {mainLinks.map((link) => renderMainLink(link))}
            </NavigationMenuList>
          </NavigationMenu>
          <form
            role="search"
            className="relative w-72"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(localSearch);
            }}
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              type="search"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder={t('navbar.searchPosts')}
              aria-label={t('navbar.searchPosts')}
              className="pl-10"
            />
          </form>
        </div>
        <div className="flex items-center gap-2">
          {quickActions}
          <LanguageSwitcher className="hidden lg:inline-flex" />
          <ThemeToggle className="hidden lg:inline-flex" />
          {primaryRole ? <RoleBadge role={primaryRole} className="hidden lg:inline-flex" /> : null}
          {isLoading ? null : authContent}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={isMobileMenuOpen ? t('navbar.menuClose') : t('navbar.menuOpen')}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <AlignJustify className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.div
              key="mobile-backdrop"
              className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              key="mobile-menu"
              id="mobile-navigation"
              className="fixed inset-x-0 top-20 z-40 mx-auto w-full max-w-md origin-top rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/95"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {primaryRole ? <RoleBadge role={primaryRole} className="mb-4" /> : null}
              <form
                role="search"
                className="mb-5 flex flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setSearch(localSearch);
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <Input
                    type="search"
                    value={localSearch}
                    onChange={(event) => setLocalSearch(event.target.value)}
                    placeholder={t('navbar.searchPosts')}
                    aria-label={t('navbar.searchPosts')}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button type="submit" className="flex-1">
                    {t('navbar.mobileSearchSubmit')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => {
                      resetFilters();
                      setLocalSearch('');
                    }}
                  >
                    {t('navbar.mobileSearchClear')}
                  </Button>
                </div>
              </form>
              <div className="flex flex-col gap-2">
                {mobileLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.action != null
                      ? false
                      : link.match
                      ? link.match(location.pathname)
                      : location.pathname === link.to;

                  if (link.action) {
                    return (
                      <Button
                        key={link.label}
                        variant="ghost"
                        className="justify-start rounded-2xl px-4 py-3 text-base"
                        onClick={async () => {
                          await link.action();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                        {link.label}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      key={link.to}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'justify-start rounded-2xl px-4 py-3 text-base',
                        isActive
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                          : 'text-slate-600 dark:text-slate-200'
                      )}
                      asChild
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to={link.to} className="flex w-full items-center gap-3">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        <span>{link.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">{t('navbar.theme')}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{t('navbar.themeMode', { mode: t(isDark ? 'navbar.modeDark' : 'navbar.modeLight') })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher className="lg:hidden" />
                  <ThemeToggle />
                </div>
              </div>
            </motion.nav>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;
