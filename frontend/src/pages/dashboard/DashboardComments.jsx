import { useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import EmptyState from '../../components/backoffice/EmptyState.jsx';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { Button } from '../../components/ui/button.jsx';

function DashboardComments() {
  const { setHeader } = useDashboardLayout();

  useEffect(() => {
    setHeader({
      title: 'Comentarios',
      description: 'Modera la conversación y coordina respuestas con el equipo.',
      showSearch: false,
      actions: null
    });
  }, [setHeader]);

  return (
    <EmptyState
      icon={MessageSquare}
      title="Moderación en camino"
      description="Aquí verás las colas de moderación, respuestas pendientes y métricas de participación cuando conectemos la API de comentarios."
      action={
        <Button type="button" variant="ghost" size="sm" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Volver al resumen
        </Button>
      }
    />
  );
}

export default DashboardComments;
