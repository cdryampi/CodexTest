import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import Balancer from 'react-wrap-balancer';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button.jsx';
import { getHeroImage } from '../../lib/img.js';

const MotionButton = motion(Button);

function Hero() {
  const heroImage = useMemo(() => getHeroImage('landing', 1280, 720), []);

  return (
    <section
      className="relative isolate overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-gray-50 to-white px-6 py-20 shadow-sm transition-colors duration-500 dark:border-slate-800 dark:from-gray-900 dark:to-gray-950 sm:px-10 lg:px-16"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.25),_transparent_60%)] before:content-[''] dark:before:bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.35),_transparent_60%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col-reverse items-center gap-14 lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-sm font-semibold text-sky-600 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300">
            Blog técnico en español
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            <Balancer>
              Impulsa tus proyectos con React, Tailwind y experiencias accesibles
            </Balancer>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            <Balancer>
              Aprende a construir interfaces modernas, anima tus componentes con Framer Motion y aplica patrones productivos sin
              perder la accesibilidad. Cada artículo llega con ejemplos listos para producción.
            </Balancer>
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <MotionButton
              asChild
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Explorar las publicaciones recientes"
            >
              <Link to="/blog">Explorar artículos</Link>
            </MotionButton>
            <MotionButton
              asChild
              variant="outline"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Ver la evolución del proyecto en la timeline"
            >
              <Link to="/timeline">Ver roadmap</Link>
            </MotionButton>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="relative w-full max-w-xl"
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900/5 shadow-2xl ring-1 ring-slate-900/10 dark:border-slate-700/60 dark:bg-slate-900/30 dark:ring-slate-50/10">
            <img
              src={heroImage}
              alt="Previsualización del blog con artículos destacados"
              loading="lazy"
              className="aspect-[5/3] w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-sky-500/20 via-transparent to-transparent mix-blend-multiply" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default memo(Hero);
