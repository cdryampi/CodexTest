import { Sidebar } from 'flowbite-react';
import {
  HomeModernIcon,
  NewspaperIcon,
  TagIcon,
  Squares2X2Icon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';

const items = [
  {
    label: 'Resumen',
    to: '/dashboard',
    icon: HomeModernIcon
  },
  {
    label: 'Posts',
    to: '/dashboard/posts',
    icon: NewspaperIcon
  },
  {
    label: 'Categorías',
    to: '/dashboard/categories',
    icon: Squares2X2Icon
  },
  {
    label: 'Tags',
    to: '/dashboard/tags',
    icon: TagIcon
  },
  {
    label: 'Perfil',
    to: '/profile',
    icon: UserCircleIcon
  }
];

function DashboardSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <Sidebar aria-label="Menú de administración" className="h-full rounded-xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <Sidebar.Items>
          <Sidebar.ItemGroup>
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Sidebar.Item
                  key={item.to}
                  as={Link}
                  to={item.to}
                  icon={Icon}
                  className={
                    isActive
                      ? 'bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }
                  active={isActive}
                >
                  {item.label}
                </Sidebar.Item>
              );
            })}
          </Sidebar.ItemGroup>
        </Sidebar.Items>
      </Sidebar>
    </aside>
  );
}

export default DashboardSidebar;

