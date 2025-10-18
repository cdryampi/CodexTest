import { Button } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white">404</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        La página que buscas no existe o fue movida. Usa el botón de abajo para volver al inicio.
      </p>
      <div className="mt-6 flex justify-center">
        <Button color="light" onClick={() => navigate('/')} className="inline-flex items-center gap-2">
          <HomeIcon className="h-5 w-5" aria-hidden="true" />
          Ir al inicio
        </Button>
      </div>
    </div>
  );
}

export default NotFound;
