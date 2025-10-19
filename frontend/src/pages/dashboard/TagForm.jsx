import { Button, Card } from 'flowbite-react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import DashboardLayout from './DashboardLayout.jsx';

function TagForm() {
  return (
    <DashboardLayout
      title="Gestión de etiquetas"
      description="Las etiquetas se administran automáticamente desde el backend al crear o editar posts."
      actions={
        <Button as={Link} to="/dashboard/tags" color="light" className="flex items-center gap-2">
          <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
          Volver al listado
        </Button>
      }
    >
      <Card className="space-y-4 border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-sky-100 p-3 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
            <LightBulbIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <p>
              Las etiquetas del blog se generan a partir de los nombres indicados en cada post. Cuando creas o editas una publicación, el backend se encarga de crear la etiqueta si no existe y de asociarla automáticamente.
            </p>
            <p>
              Para añadir, renombrar o eliminar etiquetas, edita los posts correspondientes desde el panel de publicaciones.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button as={Link} to="/dashboard/posts" color="info" className="flex items-center gap-2">
            Gestionar posts
          </Button>
        </div>
      </Card>
    </DashboardLayout>
  );
}

export default TagForm;

