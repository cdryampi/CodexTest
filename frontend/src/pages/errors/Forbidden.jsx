import { useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldExclamationIcon, ArrowLeftIcon, HomeIcon } from '@heroicons/react/24/outline';

function Forbidden() {
  const navigate = useNavigate();
  const alertRef = useRef(null);

  useEffect(() => {
    const node = alertRef.current;
    if (!node || typeof node.focus !== 'function') {
      return;
    }
    try {
      node.focus({ preventScroll: false });
    } catch (error) {
      node.focus();
    }
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Helmet>
        <title>Acceso restringido</title>
      </Helmet>
      <motion.div
        ref={alertRef}
        role="alert"
        tabIndex={-1}
        aria-live="assertive"
        className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-xl outline-none backdrop-blur dark:border-slate-800 dark:bg-slate-900/70"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-300"
          initial={{ scale: 0.9, rotate: -4 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <ShieldExclamationIcon className="h-10 w-10" aria-hidden="true" />
        </motion.div>
        <h1 className="mt-8 text-3xl font-semibold text-slate-900 dark:text-slate-50">
          No tienes permisos para ver esta sección
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
          Tu sesión es válida, pero tus permisos actuales no incluyen acceso a este panel. Si crees que se trata de un error,
          contacta al equipo administrador para solicitar ayuda.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button color="dark" onClick={() => navigate('/dashboard')} className="inline-flex items-center gap-2">
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            Volver al Dashboard
          </Button>
          <Button color="light" onClick={() => navigate('/')} className="inline-flex items-center gap-2">
            <HomeIcon className="h-5 w-5" aria-hidden="true" />
            Ir al Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default Forbidden;
