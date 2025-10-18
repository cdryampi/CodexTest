import { useEffect, useState } from 'react';
import { Navbar, TextInput, Button } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';
import {
  BoltIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  SunIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import { useUIStore, selectIsDark, selectSearch } from '../store/useUI';

function NavBar() {
  const location = useLocation();
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

  return (
    <Navbar
      fluid
      rounded
      className="border-b border-slate-200 bg-white/80 py-4 text-slate-700 shadow-sm backdrop-blur transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-200"
    >
      <Navbar.Brand as={Link} to="/" className="group flex items-center gap-2">
        <BoltIcon className="h-7 w-7 text-sky-600 transition-transform duration-300 group-hover:rotate-12 dark:text-sky-400" aria-hidden="true" />
        <span className="self-center whitespace-nowrap text-xl font-semibold text-slate-900 dark:text-white">
          React Tailwind Blog
        </span>
      </Navbar.Brand>
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
        <Navbar.Toggle className="text-slate-600 hover:text-slate-900 focus:outline-none dark:text-slate-200 dark:hover:text-white" />
      </div>
      <Navbar.Collapse className="space-y-4 md:space-y-0">
        <Navbar.Link as={Link} to="/" active={location.pathname === '/'} className="flex items-center gap-2 text-base text-slate-600 transition duration-300 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300">
          <HomeIcon className="h-5 w-5" aria-hidden="true" />
          Inicio
        </Navbar.Link>
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
      </Navbar.Collapse>
    </Navbar>
  );
}

export default NavBar;
