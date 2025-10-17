import { Navbar } from 'flowbite-react';
import { Link, useLocation } from 'react-router-dom';
import {
  BoltIcon,
  CodeBracketIcon,
  HomeModernIcon,
  InformationCircleIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Inicio', to: '/', icon: HomeModernIcon, type: 'route' },
  { name: 'Acerca del blog', to: '#acerca', icon: InformationCircleIcon, type: 'anchor' }
];

function NavBar({ onToggleTheme, isDark }) {
  const location = useLocation();

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
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
          aria-label={themeLabel}
          title={themeLabel}
          aria-pressed={isDark}
        >
          {isDark ? (
            <MoonIcon className="h-5 w-5" aria-hidden="true" />
          ) : (
            <SunIcon className="h-5 w-5" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{isDark ? 'Oscuro' : 'Claro'}</span>
        </button>
        <Navbar.Toggle className="text-slate-600 hover:text-slate-900 focus:outline-none dark:text-slate-200 dark:hover:text-white" />
      </div>
      <Navbar.Collapse className="space-y-2 sm:space-y-0">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.type === 'route'
              ? location.pathname === item.to
              : location.hash === item.to;
          const linkProps =
            item.type === 'route'
              ? { as: Link, to: item.to }
              : { href: item.to };
          return (
            <Navbar.Link
              key={item.name}
              {...linkProps}
              active={isActive}
              className="flex items-center gap-2 text-base text-slate-600 transition duration-300 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {item.name}
            </Navbar.Link>
          );
        })}
        <Navbar.Link
          href="https://github.com/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-base text-slate-600 transition duration-300 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-300"
        >
          <CodeBracketIcon className="h-5 w-5" aria-hidden="true" />
          GitHub
        </Navbar.Link>
        <div className="sm:hidden">
          <button
            type="button"
            onClick={onToggleTheme}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
            aria-label={`${themeLabel} (navegación móvil)`}
            aria-pressed={isDark}
          >
            {isDark ? (
              <MoonIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <SunIcon className="h-5 w-5" aria-hidden="true" />
            )}
            <span>{isDark ? 'Modo oscuro' : 'Modo claro'}</span>
          </button>
        </div>
      </Navbar.Collapse>
    </Navbar>
  );
}

export default NavBar;
