import { Card, Badge } from 'flowbite-react';
import { Link } from 'react-router-dom';
import {
  ArrowRightIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import posts from '../data/posts.json';

function Home() {
  return (
    <section className="space-y-12">
      <header className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
          Blog tecnológico en español
        </p>
        <h1 className="text-4xl font-bold text-slate-900 transition-colors duration-300 dark:text-white sm:text-5xl">
          Ideas frescas para construir interfaces modernas
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-300">
          Explora artículos pensados para acelerar tus proyectos con React, Tailwind CSS y Flowbite. Cada publicación incluye consejos prácticos y buenas prácticas listas para aplicar hoy mismo.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {posts.map((post) => (
          <Card
            key={post.id}
            imgAlt={post.imagenAlt}
            imgSrc={post.imagen}
            className="flex h-full flex-col justify-between overflow-hidden border border-slate-200 bg-white/90 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-sky-500/10 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:shadow-sky-400/10"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {post.etiquetas.map((tag) => (
                  <Badge key={tag} color="info" className="bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 dark:text-white">
                {post.titulo}
              </h2>
              <p className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <UserCircleIcon className="h-4 w-4" aria-hidden="true" />
                  {post.autor}
                </span>
                <span className="inline-flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" aria-hidden="true" />
                  {new Date(post.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}
                </span>
              </p>
              <p className="text-base text-slate-600 dark:text-slate-300">{post.resumen}</p>
            </div>
            <div className="pt-4">
              <Link
                to={`/post/${post.id}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition duration-300 hover:gap-3 hover:text-sky-500 dark:text-sky-300 dark:hover:text-sky-200"
              >
                Leer artículo completo
                <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <section id="acerca" className="rounded-3xl border border-slate-200 bg-white/80 p-8 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 dark:text-white">Sobre este blog</h2>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Este proyecto demuestra cómo combinar React con Tailwind CSS, Flowbite y React Router para construir un blog estático moderno. Utiliza datos locales en formato JSON y está preparado para desplegarse automáticamente en GitHub Pages mediante GitHub Actions.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ChatBubbleLeftEllipsisIcon className="h-4 w-4" aria-hidden="true" />
            Comentarios moderados localmente
          </span>
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-4 w-4" aria-hidden="true" />
            Actualizaciones continuas
          </span>
        </div>
      </section>
    </section>
  );
}

export default Home;
