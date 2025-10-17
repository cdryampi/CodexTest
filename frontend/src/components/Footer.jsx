import { CommandLineIcon, EnvelopeIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/',
    icon: CommandLineIcon
  },
  {
    name: 'Portafolio',
    href: 'https://react-tailwind-blog.example.com',
    icon: GlobeAltIcon
  },
  {
    name: 'Contacto',
    href: 'mailto:hola@example.com',
    icon: EnvelopeIcon
  }
];

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-10 text-slate-600 transition-colors duration-300 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-300">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">React Tailwind Blog</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Construido con React, Tailwind CSS, Flowbite y cariño por las interfaces bien pensadas.
          </p>
        </div>
        <ul className="flex items-center gap-4">
          {socialLinks.map(({ name, href, icon: Icon }) => (
            <li key={name}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-500 transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-sky-400 dark:hover:text-sky-300"
              >
                <span className="sr-only">{name}</span>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
        © {new Date().getFullYear()} React Tailwind Blog. Todos los derechos reservados.
      </p>
    </footer>
  );
}

export default Footer;
