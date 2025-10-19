import { useEffect, useMemo, useState } from 'react';
import { Navbar as FlowbiteNavbar, TextInput, Button, Dropdown, Avatar } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BoltIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  HomeIcon,
  ClockIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { useUIStore, selectIsDark, selectSearch } from '../store/useUI';
import { useAuth } from '../context/AuthContext.jsx';

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
    }, 300);

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

  const authLinks = isAuthenticated ? (
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
      <Dropdown.Item as={Link} to="/dashboard" icon={BoltIcon}>
        Dashboard
      </Dropdown.Item>
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
      className="border-b border-slate-200 bg-white/80 py-4 text-slate-700 shadow-sm backdrop-blur transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200"
    >
      <FlowbiteNavbar.Brand as={Link} to="/" className="group flex items-center gap-2">
        <BoltIcon className="h-7 w-7 text-sky-600 transition-transform duration-300 group-hover:rotate-12 dark:text-sky-400" aria-hidden="true" />
        <span className="self-center whitespace-nowrap text-xl font-semibold text-slate-900 dark:text-white">
          React Tailwind Blog
        </span>
      </FlowbiteNavbar.Brand>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex">
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
              onChange={(event) => setLocalSearch(event.target.value.toLowerCase())}
              placeholder="Buscar artículos"
              icon={MagnifyingGlassIcon}
              aria-label="Buscar publicaciones"
              className="w-64"
            />
          </form>
        </div>
        <Button
          color="light"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
          aria-pressed={isDark}
          type="button"
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 text-slate-600 transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
        >
          {isDark ? <MoonIcon className="h-5 w-5" aria-hidden="true" /> : <SunIcon className="h-5 w-5" aria-hidden="true" />}
        </Button>
        {isLoading ? null : authLinks}
        <FlowbiteNavbar.Toggle className="text-slate-600 hover:text-slate-900 focus:outline-none dark:text-slate-200 dark:hover:text-white" />
      </div>
      <FlowbiteNavbar.Collapse className="space-y-4 md:space-y-0">
        <FlowbiteNavbar.Link as={Link} to="/" active={location.pathname === '/'} className="flex items-center gap-2 text-base text-slate-600 transition duration-300 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300">
          <HomeIcon className="h-5 w-5" aria-hidden="true" />
          Inicio
        </FlowbiteNavbar.Link>
        <FlowbiteNavbar.Link
          as={Link}
          to="/timeline"
          active={location.pathname.startsWith('/timeline')}
          className="flex items-center gap-2 text-base text-slate-600 transition duration-300 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
        >
          <ClockIcon className="h-5 w-5" aria-hidden="true" />
          Timeline
        </FlowbiteNavbar.Link>
        {isAuthenticated ? (
          <FlowbiteNavbar.Link
            as={Link}
            to="/dashboard"
            active={location.pathname.startsWith('/dashboard')}
            className="flex items-center gap-2 text-base text-slate-600 transition duration-300 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
          >
            <BoltIcon className="h-5 w-5" aria-hidden="true" />
            Dashboard
          </FlowbiteNavbar.Link>
        ) : null}
        <form
          role="search"
          className="md:hidden"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(localSearch);
          }}
        >
          <TextInput
            type="search"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value.toLowerCase())}
            placeholder="Buscar artículos"
            icon={MagnifyingGlassIcon}
            aria-label="Buscar publicaciones"
          />
        </form>
        <button
          type="button"
          onClick={() => {
            resetFilters();
            setLocalSearch('');
          }}
          className="flex items-center gap-2 text-base text-slate-600 transition duration-300 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
        >
          Reiniciar filtros
        </button>
        {isLoading ? null : (
          isAuthenticated ? (
            <div className="flex flex-col gap-2">
              {isAuthenticated ? (
                <FlowbiteNavbar.Link
                  as={Link}
                  to="/dashboard"
                  className="text-base text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
                >
                  Dashboard
                </FlowbiteNavbar.Link>
              ) : null}
              <FlowbiteNavbar.Link as={Link} to="/profile" className="text-base text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300">
                Perfil
              </FlowbiteNavbar.Link>
              <Button
                color="light"
                onClick={handleLogout}
                className="justify-start text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
                aria-label="Cerrar sesión"
              >
                Cerrar sesión
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <FlowbiteNavbar.Link as={Link} to="/login" className="text-base text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300">
                Iniciar sesión
              </FlowbiteNavbar.Link>
              <FlowbiteNavbar.Link as={Link} to="/register" className="text-base text-slate-600 transition hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300">
                Registrarse
              </FlowbiteNavbar.Link>
            </div>
          )
        )}
      </FlowbiteNavbar.Collapse>
    </FlowbiteNavbar>
  );
}

export default Navbar;
