import { memo } from 'react';
import { motion } from 'framer-motion';
import Balancer from 'react-wrap-balancer';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button.jsx';
import { fadeInUp, inViewProps } from '../../lib/animation.js';

const MotionButton = motion(Button);

function CTA() {
  return (
    <section className="mx-auto max-w-5xl px-4">
      <motion.div
        {...inViewProps(0.4)}
        variants={fadeInUp}
        className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 p-10 text-center text-white shadow-xl dark:border-sky-500/40"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)] opacity-80" />
        <div className="relative space-y-6">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            <Balancer>Lanza experiencias digitales memorables en cuestión de semanas</Balancer>
          </h2>
          <p className="text-lg leading-relaxed text-sky-100">
            <Balancer>
              Únete a la comunidad y recibe recursos exclusivos, componentes listos para usar y tutoriales orientados a resultados.
            </Balancer>
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <MotionButton
              asChild
              size="lg"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-8"
              aria-label="Crear una cuenta para guardar tus recursos"
            >
              <Link to="/register">Crear cuenta gratis</Link>
            </MotionButton>
            <MotionButton
              asChild
              variant="ghost"
              size="lg"
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="text-white/80 hover:text-white"
              aria-label="Ver publicaciones destacadas"
            >
              <Link to="/blog">Ver artículos destacados</Link>
            </MotionButton>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

export default memo(CTA);
