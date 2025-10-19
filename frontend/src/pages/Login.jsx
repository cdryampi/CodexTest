import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Label, TextInput } from 'flowbite-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext.jsx';

const loginSchema = z.object({
  email: z.string({ required_error: 'El correo es obligatorio.' }).email('Introduce un correo válido.'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria.' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
});

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await login(values);
      toast.success('¡Sesión iniciada correctamente!');
      const redirectPath = location.state?.from?.pathname ?? '/profile';
      navigate(redirectPath, { replace: true });
    } catch (error) {
      const detail = error?.response?.data?.detail ?? 'No se pudo iniciar sesión. Verifica tus credenciales.';
      toast.error(detail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-8">
      <Helmet>
        <title>Iniciar sesión</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="w-full border border-slate-200/60 bg-white/80 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Inicia sesión</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Accede con tu correo y contraseña para gestionar tu perfil.
          </p>
        </header>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <TextInput
              id="email"
              type="email"
              placeholder="nombre@dominio.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <TextInput
              id="password"
              type="password"
              placeholder="********"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-600 font-semibold text-white transition hover:bg-sky-700 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {submitting ? 'Validando...' : 'Iniciar sesión'}
          </Button>
        </form>
        <footer className="text-center text-sm text-slate-600 dark:text-slate-300">
          ¿Aún no tienes cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-sky-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-400"
          >
            Regístrate aquí
          </Link>
        </footer>
      </Card>
    </section>
  );
}

export default Login;
