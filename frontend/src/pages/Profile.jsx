import { useEffect, useState } from 'react';
import { Button, Card, Spinner } from 'flowbite-react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';

function Profile() {
  const { user, getCurrentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loadingProfile, setLoadingProfile] = useState(!user);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setLoadingProfile(true);
      getCurrentUser()
        .catch(() => {
          /* La lógica de logout ya se maneja en el contexto */
        })
        .finally(() => {
          if (isMounted) {
            setLoadingProfile(false);
          }
        });
    } else {
      setLoadingProfile(false);
    }

    return () => {
      isMounted = false;
    };
  }, [getCurrentUser, user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Sesión cerrada correctamente.');
    navigate('/login');
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
        <Spinner size="lg" />
        <span>Cargando tu perfil...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 items-start justify-center py-8">
      <Helmet>
        <title>Mi perfil</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="w-full border border-slate-200/60 bg-white/80 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Tu perfil</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Gestiona tus datos y mantén segura tu cuenta.
          </p>
        </header>
        <dl className="mt-6 space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Nombre de usuario</dt>
            <dd className="text-lg font-semibold text-slate-900 dark:text-white">{user.username}</dd>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Correo electrónico</dt>
            <dd className="text-lg font-semibold text-slate-900 dark:text-white">{user.email}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Los tokens JWT se renuevan automáticamente mientras mantengas la sesión abierta.
          </span>
          <Button
            color="light"
            onClick={handleLogout}
            className="self-stretch border border-slate-200 text-slate-700 hover:text-sky-600 focus-visible:ring-sky-500 dark:border-slate-700 dark:text-slate-200 dark:hover:text-sky-300"
          >
            Cerrar sesión
          </Button>
        </div>
      </Card>
    </section>
  );
}

export default Profile;
