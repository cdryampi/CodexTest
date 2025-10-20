import { memo } from 'react';
import { motion } from 'framer-motion';
import Balancer from 'react-wrap-balancer';
import { Atom, Sparkles, Workflow, ShieldCheck, Timer, Zap } from 'lucide-react';
import { createStagger, fadeInUp, inViewProps } from '../../lib/animation.js';

const features = [
  {
    title: 'UI pensada para escalar',
    description:
      'Componentes diseñados con Tailwind, Flowbite y Radix para mantener consistencia y accesibilidad en cada pantalla.',
    icon: Workflow
  },
  {
    title: 'Animaciones fluidas',
    description: 'Framer Motion y utilidades tailwindcss-animate aportan microinteracciones suaves y sin saltos visuales.',
    icon: Sparkles
  },
  {
    title: 'Contenido accionable',
    description: 'Tutoriales con snippets listos, guías de arquitectura y patrones reutilizables en proyectos reales.',
    icon: Atom
  },
  {
    title: 'Rendimiento y seguridad',
    description: 'Buenas prácticas de caching, sanitización y autenticación listas para conectar con tu backend.',
    icon: ShieldCheck
  },
  {
    title: 'Productividad inmediata',
    description: 'Atajos de diseño, checklists y dashboards que aceleran entregas desde el primer sprint.',
    icon: Timer
  },
  {
    title: 'Integraciones modernas',
    description: 'Ejemplos reales conectando API REST, analítica y automatizaciones sin añadir peso innecesario.',
    icon: Zap
  }
];

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4">
      <motion.div
        {...inViewProps(0.3)}
        variants={fadeInUp}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-sky-500">Características clave</span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          <Balancer>Diseñamos experiencias web memorables sin sacrificar velocidad</Balancer>
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          <Balancer>
            Cada módulo combina guías prácticas, patrones reutilizables y herramientas para que tu equipo shippee features con
            confianza, manteniendo estándares de accesibilidad y performance.
          </Balancer>
        </p>
      </motion.div>
      <motion.div
        {...inViewProps(0.25)}
        variants={createStagger(0.1, 0.15)}
        className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              style={{ animationDelay: `${index * 80}ms` }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -top-20 -right-12 h-40 w-40 rounded-full bg-sky-500/10 blur-2xl" />
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 transition-colors group-hover:bg-sky-500 group-hover:text-white dark:bg-sky-500/15 dark:text-sky-300">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

export default memo(FeatureGrid);
