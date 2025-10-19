import { useEffect } from 'react';
import { Users } from 'lucide-react';
import EmptyState from '../../components/backoffice/EmptyState.jsx';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { Button } from '../../components/ui/button.jsx';

function DashboardUsers() {
  const { setHeader } = useDashboardLayout();

  useEffect(() => {
    setHeader({
      title: 'Usuarios',
      description: 'Administra los permisos y miembros del equipo editorial.',
      showSearch: false,
      actions: null
    });
  }, [setHeader]);

  return (
    <EmptyState
      icon={Users}
      title="Gestión de usuarios pendiente"
      description="Cuando integremos autenticación con el backend podrás invitar personas, asignar roles y revisar actividad reciente."
      action={
        <Button type="button" variant="ghost" size="sm">
          Descubrir próximos cambios
        </Button>
      }
    />
  );
}

export default DashboardUsers;
