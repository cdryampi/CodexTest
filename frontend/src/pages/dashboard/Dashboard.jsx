import { useEffect, useState } from 'react';
import { Card, Spinner } from 'flowbite-react';
import { ChartBarSquareIcon, Squares2X2Icon, TagIcon } from '@heroicons/react/24/outline';
import DashboardLayout from './DashboardLayout.jsx';
import { listarPosts } from '../../services/posts.js';
import { listarCategorias } from '../../services/categories.js';
import { listarTags } from '../../services/tags.js';
import toast from 'react-hot-toast';

const metrics = [
  {
    key: 'posts',
    title: 'Posts publicados',
    description: 'Entradas disponibles en la API del blog.',
    icon: ChartBarSquareIcon
  },
  {
    key: 'categories',
    title: 'Categorías activas',
    description: 'Agrupaciones registradas para clasificar contenido.',
    icon: Squares2X2Icon
  },
  {
    key: 'tags',
    title: 'Etiquetas detectadas',
    description: 'Tags únicos presentes en los posts publicados.',
    icon: TagIcon
  }
];

const extractCount = (payload) => {
  if (payload == null) return 0;
  if (typeof payload === 'number') return payload;
  if (Array.isArray(payload)) return payload.length;
  if (typeof payload === 'object') {
    if (typeof payload.count === 'number') return payload.count;
    if (Array.isArray(payload.results)) return payload.results.length;
    if (Array.isArray(payload.data)) return payload.data.length;
  }
  return 0;
};

function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, categories: 0, tags: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [postsResponse, categoriesResponse, tagsResponse] = await Promise.all([
          listarPosts({ pageSize: 1 }),
          listarCategorias(),
          listarTags()
        ]);

        setStats({
          posts: extractCount(postsResponse),
          categories: extractCount(categoriesResponse),
          tags: Array.isArray(tagsResponse) ? tagsResponse.length : extractCount(tagsResponse)
        });
      } catch (error) {
        toast.error('No se pudieron obtener las métricas del dashboard.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout
      title="Panel de control"
      description="Consulta de un vistazo el estado del contenido del blog."
    >
      {isLoading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner aria-label="Cargando métricas" size="xl" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card
                key={metric.key}
                className="border border-slate-200 bg-white/90 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-sky-100 p-3 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                    <Icon className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{metric.title}</p>
                    <p className="text-3xl font-semibold text-slate-900 dark:text-white">
                      {stats[metric.key] ?? 0}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{metric.description}</p>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

export default Dashboard;

