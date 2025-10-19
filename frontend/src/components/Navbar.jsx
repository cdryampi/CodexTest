import { useEffect, useMemo, useState } from 'react';
import { Navbar as FlowbiteNavbar, TextInput, Button, Dropdown, Avatar } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightOnRectangleIcon,
  BoltIcon,
  ClockIcon,
  DocumentDuplicateIcon,
  DocumentTextIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  SunIcon,
  TagIcon,
  UserCircleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useUIStore, selectIsDark, selectSearch } from '../store/useUI';
import { useAuth } from '../context/AuthContext.jsx';

const mainLinks = [
  {
    to: '/',
    label: 'Inicio',
    icon: HomeIcon
  },
  {
    to: '/timeline',
    label: 'Timeline',
    icon: ClockIcon
  }
];

const dashboardLinks = [
  {
    to: '/dashboard',
    label: 'Panel',
    icon: Squares2X2Icon,
    match: (path) => path === '/dashboard'
  },
  {
    to: '/dashboard/posts',
    label: 'Posts',
    icon: DocumentTextIcon,
    match: (path) => path.startsWith('/dashboard/posts')
  },
  {
    to: '/dashboard/categories',
    label: 'Categorías',
    icon: DocumentDuplicateIcon,
    match: (path) => path.startsWith('/dashboard/categories')
  },
  {
    to: '/dashboard/tags',
    label: 'Etiquetas',
    icon: TagIcon,
    match: (path) => path.startsWith('/dashboard/tags')
  }
];

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const isDark = useUIStore(selectIsDark);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const globalSearch = useUIStore(selectSearch);
  const setSearch = useUIStore((state) => state.setSearch);
  const resetFilters = useUIStore((state) => state.resetFilters);

  const [localSearch, setLocalSearch] = useState(globalSearch);

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

  const themeLabel = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const renderNavLink = (link) => {
    const Icon = link.icon;
    const isActive = link.match ? link.match(location.pathname) : location.pathname === link.to;

    return (
      <FlowbiteNavbar.Link
        key={link.to}
        as={Link}
        to={link.to}
        active={isActive}
        className="flex items-center gap-2 text-base font-medium text-slate-600 transition-colors duration-200 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {link.label}
      </FlowbiteNavbar.Link>
    );
  };

  const quickActions = isAuthenticated ? (
    <Button
      as={Link}
      to="/dashboard/posts/new"
      color="info"
      size="sm"
      className="hidden lg:flex items-center gap-2 shadow-sm"
    >
      <PlusCircleIcon className="h-5 w-5" aria-hidden="true" />
      Nuevo post
    </Button>
  ) : null;

  const themeToggle = (
    <Button
      color="light"
      onClick={toggleTheme}
      aria-label={themeLabel}
      title={themeLabel}
      aria-pressed={isDark}
      type="button"
      className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 text-slate-600 transition duration-200 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
    >
      {isDark ? <MoonIcon className="h-5 w-5" aria-hidden="true" /> : <SunIcon className="h-5 w-5" aria-hidden="true" />}
    </Button>
  );

  const authContent = isAuthenticated ? (
    <Dropdown
      label={
        <div className="flex items-center gap-2">
          <Avatar
            rounded
            alt={displayName || 'Perfil de usuario'}
            placeholderInitials={avatarInitials}
          />
          <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
            {displayName || user?.email}
          </span>
        </div>
      }
      arrowIcon={false}
      inline
    >
      {dashboardLinks.map((link) => (
        <Dropdown.Item key={link.to} as={Link} to={link.to} icon={link.icon}>
          {link.label}
        </Dropdown.Item>
      ))}
      <Dropdown.Item as={Link} to="/profile" icon={UserCircleIcon}>
        Perfil
      </Dropdown.Item>
      <Dropdown.Item icon={ArrowRightOnRectangleIcon} onClick={handleLogout}>
        Cerrar sesión
      </Dropdown.Item>
    </Dropdown>
  ) : (
    <div className="flex items-center gap-3">
      <Button
        as={Link}
        to="/login"
        color="light"
        size="sm"
        className="text-slate-700 transition hover:text-sky-600 dark:text-slate-200 dark:hover:text-sky-300"
      >
        <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" />
        Iniciar sesión
      </Button>
      <Button
        as={Link}
        to="/register"
        color="light"
        size="sm"
        className="bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
      >
        <UserPlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
        Registrarse
      </Button>
    </div>
  );

  return (
    <FlowbiteNavbar
      fluid
      rounded
      className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 py-3 text-slate-700 shadow-sm backdrop-blur-lg transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-950/70 dark:text-slate-200"
    >
      <FlowbiteNavbar.Brand as={Link} to="/" className="group flex items-center gap-2">
        <BoltIcon className="h-7 w-7 text-sky-600 transition-transform duration-300 group-hover:rotate-12 dark:text-sky-400" aria-hidden="true" />
        <span className="self-center whitespace-nowrap text-xl font-semibold text-slate-900 dark:text-white">
          React Tailwind Blog
        </span>
      </FlowbiteNavbar.Brand>
      <div className="flex items-center gap-3">
        <div className="hidden lg:block">
          <form
            role="search"
            className="relative"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(localSearch);
            }}
          >
            <TextInput
              type="search"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Buscar publicaciones"
              icon={MagnifyingGlassIcon}
              aria-label="Buscar publicaciones"
              className="w-72"
            />
          </form>
        </div>
        {quickActions}
        {themeToggle}
        {isLoading ? null : authContent}
        <FlowbiteNavbar.Toggle className="text-slate-600 hover:text-slate-900 focus:outline-none dark:text-slate-200 dark:hover:text-white" />
      </div>
      <FlowbiteNavbar.Collapse className="space-y-4 lg:space-y-2">
        <div className="lg:hidden">
          <form
            role="search"
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(localSearch);
            }}
          >
            <TextInput
              type="search"
              value={localSearch}
              onChange={(event) => setLocalSearch(event.target.value)}
              placeholder="Buscar publicaciones"
              icon={MagnifyingGlassIcon}
              aria-label="Buscar publicaciones"
            />
            <Button
              type="button"
              color="light"
              onClick={() => {
                resetFilters();
                setLocalSearch('');
              }}
            >
              Limpiar filtros
            </Button>
          </form>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Explorar</p>
          {mainLinks.map((link) => renderNavLink(link))}
        </div>
        {isAuthenticated ? (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Backoffice</p>
            {dashboardLinks.map((link) => renderNavLink(link))}
            <FlowbiteNavbar.Link
              as={Link}
              to="/profile"
              active={location.pathname.startsWith('/profile')}
              className="flex items-center gap-2 text-base font-medium text-slate-600 transition-colors duration-200 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
            >
              <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
              Perfil
            </FlowbiteNavbar.Link>
            <Button
              color="light"
              onClick={handleLogout}
              className="mt-2 justify-start text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
            >
              <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              Cerrar sesión
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tu cuenta</p>
            <Button as={Link} to="/login" color="light" className="justify-start">
              <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              Iniciar sesión
            </Button>
            <Button as={Link} to="/register" color="info" className="justify-start">
              <UserPlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              Crear cuenta
            </Button>
          </div>
        )}
      </FlowbiteNavbar.Collapse>
    </FlowbiteNavbar>
  );
}

export default Navbar;
