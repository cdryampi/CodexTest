import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Label, TextInput } from 'flowbite-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext.jsx';

const registerSchema = z
  .object({
    username: z
      .string({ required_error: 'El nombre de usuario es obligatorio.' })
      .min(3, 'Usa al menos 3 caracteres.'),
    email: z.string({ required_error: 'El correo es obligatorio.' }).email('Introduce un correo válido.'),
    password1: z
      .string({ required_error: 'La contraseña es obligatoria.' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    password2: z
      .string({ required_error: 'Confirma tu contraseña.' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  })
  .refine((data) => data.password1 === data.password2, {
    message: 'Las contraseñas no coinciden.',
    path: ['password2']
  });

function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password1: '',
      password2: ''
    }
  });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await registerUser(values);
      toast.success('Cuenta creada. Revisa tu correo de bienvenida.');
      navigate('/login', { replace: true });
    } catch (error) {
      const apiErrors = error?.response?.data;
      if (apiErrors && typeof apiErrors === 'object') {
        const messages = Object.values(apiErrors)
          .flat()
          .join(' ');
        toast.error(messages || 'No se pudo completar el registro.');
      } else {
        toast.error('No se pudo completar el registro.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center py-8">
      <Helmet>
        <title>Crear cuenta</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <Card className="w-full border border-slate-200/60 bg-white/80 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Crea tu cuenta</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Regístrate para guardar artículos y participar en la comunidad.
          </p>
        </header>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <TextInput
              id="username"
              placeholder="Tu nombre"
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
              {...register('username')}
            />
            {errors.username ? (
              <p id="username-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.username.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <TextInput
              id="email"
              type="email"
              placeholder="nombre@dominio.com"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'register-email-error' : undefined}
              {...register('email')}
            />
            {errors.email ? (
              <p id="register-email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password1">Contraseña</Label>
            <TextInput
              id="password1"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password1)}
              aria-describedby={errors.password1 ? 'password1-error' : undefined}
              {...register('password1')}
            />
            {errors.password1 ? (
              <p id="password1-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password1.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password2">Confirma tu contraseña</Label>
            <TextInput
              id="password2"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password2)}
              aria-describedby={errors.password2 ? 'password2-error' : undefined}
              {...register('password2')}
            />
            {errors.password2 ? (
              <p id="password2-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password2.message}
              </p>
            ) : null}
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-sky-600 font-semibold text-white transition hover:bg-sky-700 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            {submitting ? 'Registrando...' : 'Crear cuenta'}
          </Button>
        </form>
        <footer className="text-center text-sm text-slate-600 dark:text-slate-300">
          ¿Ya tienes una cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-sky-400"
          >
            Inicia sesión
          </Link>
        </footer>
      </Card>
    </section>
  );
}

export default Register;
