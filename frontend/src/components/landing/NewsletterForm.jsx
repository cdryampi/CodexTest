import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import Balancer from 'react-wrap-balancer';
import { toast } from 'sonner';
import { Input } from '../ui/input.jsx';
import { Button } from '../ui/button.jsx';
import { fadeInUp, inViewProps } from '../../lib/animation.js';

const MotionButton = motion(Button);

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Necesitamos un correo electrónico válido para compartirte las novedades.');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      toast.success('¡Estás dentro! Te enviaremos novedades cada semana.');
      setEmail('');
    } catch (error) {
      toast.error('No pudimos completar el registro. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-4xl px-4">
      <motion.div
        {...inViewProps(0.3)}
        variants={fadeInUp}
        className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm transition-colors animate-in fade-in-50 zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-sky-500">Newsletter</span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            <Balancer>Recibe tutoriales, plantillas y retos de frontend directamente en tu bandeja</Balancer>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            <Balancer>
              Cada correo llega con recursos descargables, snippets en GitHub y retos cortos para mejorar tus habilidades semana a semana.
            </Balancer>
          </p>
        </div>
        <motion.form
          {...inViewProps(0.25)}
          variants={fadeInUp}
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 sm:flex-row"
        >
          <label htmlFor="newsletter-email" className="sr-only">
            Correo electrónico
          </label>
          <Input
            id="newsletter-email"
            type="email"
            name="email"
            placeholder="tu@correo.com"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-12 rounded-2xl bg-white/90 shadow-inner focus-visible:ring-sky-500 dark:bg-slate-900/80"
          />
          <MotionButton
            type="submit"
            size="lg"
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting}
            className="h-12 rounded-2xl"
          >
            {isSubmitting ? 'Enviando…' : 'Quiero recibir novedades'}
          </MotionButton>
        </motion.form>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Nos tomamos en serio tu privacidad. Puedes darte de baja cuando quieras con un solo clic.
        </p>
      </motion.div>
    </section>
  );
}

export default memo(NewsletterForm);
