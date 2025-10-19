import { useEffect, useMemo, useState } from 'react';
import { Spinner } from 'flowbite-react';
import StatsCards from '../../components/backoffice/StatsCards.jsx';
import PostsByMonthChart from '../../components/backoffice/charts/PostsByMonthChart.jsx';
import CommentsByDayChart from '../../components/backoffice/charts/CommentsByDayChart.jsx';
import { getDashboardStats } from '../../services/api.js';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';

function DashboardHome() {
  const { setHeader } = useDashboardLayout();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHeader({
      title: 'Resumen',
      description: 'Una mirada rápida al desempeño del contenido publicado.',
      showSearch: false,
      actions: null
    });
  }, [setHeader]);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await getDashboardStats();
        setStats(response);
      } catch (error) {
        console.error('No fue posible obtener las métricas del dashboard.', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = useMemo(() => {
    if (!stats) {
      return [];
    }
    return [
      {
        id: 'posts',
        label: 'Total de posts',
        value: stats.totals.posts,
        helper: 'Contenido publicado en el blog',
        delta: 8.5
      },
      {
        id: 'comments',
        label: 'Comentarios',
        value: stats.totals.comments,
        helper: 'Mensajes de la comunidad',
        delta: 4.3
      },
      {
        id: 'visits',
        label: 'Visitas estimadas',
        value: stats.totals.visits,
        helper: 'Tráfico acumulado del último mes',
        delta: 12.7
      },
      {
        id: 'users',
        label: 'Publicados hoy',
        value: stats.totals.publishedToday,
        helper: 'Posts publicados en la fecha más reciente',
        delta: stats.totals.publishedToday > 0 ? 2.4 : 0
      }
    ];
  }, [stats]);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
          <Spinner size="xl" />
          <p>Cargando métricas del dashboard...</p>
        </div>
      ) : (
        <>
          <StatsCards items={cards} />
          <div className="grid gap-6 lg:grid-cols-2">
            <PostsByMonthChart data={stats?.charts?.postsByMonth ?? []} />
            <CommentsByDayChart data={stats?.charts?.commentsByDay ?? []} />
          </div>
        </>
      )}
    </div>
  );
}

export default DashboardHome;
