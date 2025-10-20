import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Balancer from 'react-wrap-balancer';
import { toast } from 'sonner';
import { listLatestPosts } from '../../services/api.js';
import { getPostImage } from '../../lib/img.js';
import { createStagger, fadeInUp, hoverLift, inViewProps } from '../../lib/animation.js';

const FALLBACK_LIMIT = 6;

const formatDate = (value) => {
  if (!value) return 'Fecha por confirmar';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
      .format(new Date(value))
      .replace('.', '');
  } catch (error) {
    return 'Fecha por confirmar';
  }
};

const SkeletonCard = ({ index }) => (
  <div
    className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm animate-in fade-in-50 zoom-in-95 dark:border-slate-800 dark:bg-slate-900"
    style={{ animationDelay: `${index * 80}ms` }}
  >
    <div className="h-48 w-full bg-slate-200/70 dark:bg-slate-700/50 animate-pulse" />
    <div className="space-y-3 p-6">
      <div className="h-5 w-3/4 rounded-full bg-slate-200/80 dark:bg-slate-700/60 animate-pulse" />
      <div className="h-4 w-2/3 rounded-full bg-slate-200/70 dark:bg-slate-700/50 animate-pulse" />
      <div className="h-4 w-1/2 rounded-full bg-slate-200/60 dark:bg-slate-700/40 animate-pulse" />
    </div>
  </div>
);

function LatestPosts({ limit = FALLBACK_LIMIT }) {
  const [state, setState] = useState({ posts: [], loading: true });

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      setState((current) => ({ ...current, loading: true }));
      try {
        const results = await listLatestPosts({ limit });
        if (cancelled) return;
        setState({ posts: Array.isArray(results) ? results : [], loading: false });
      } catch (error) {
        if (cancelled) return;
        setState({ posts: [], loading: false });
        toast.error('No pudimos cargar las publicaciones recientes. Intenta de nuevo en unos segundos.');
        if (import.meta.env?.DEV) {
          console.error('Fallo al obtener posts recientes para la landing.', error);
        }
      }
    };

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  const posts = useMemo(() => state.posts.slice(0, limit), [state.posts, limit]);
  const isEmpty = !state.loading && posts.length === 0;

  return (
    <section className="mx-auto max-w-6xl px-4">
      <motion.div
        {...inViewProps(0.25)}
        variants={fadeInUp}
        className="mx-auto max-w-3xl text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-sky-500">Últimas publicaciones</span>
        <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          <Balancer>Tendencias en frontend moderno y buenas prácticas de DX</Balancer>
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          <Balancer>
            Descubre guías con código listo, análisis de herramientas y consejos para crear experiencias de usuario memorables en
            React.
          </Balancer>
        </p>
      </motion.div>

      <motion.div
        {...inViewProps(0.2)}
        variants={createStagger(0.14, 0.2)}
        className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        {state.loading
          ? Array.from({ length: Math.max(3, limit) }).map((_, index) => <SkeletonCard key={index} index={index} />)
          : posts.map((post) => (
              <motion.article
                key={post.slug ?? post.id ?? `post-${post.title}`}
                variants={fadeInUp}
                whileHover={hoverLift.whileHover}
                whileTap={hoverLift.whileTap}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <Link to={`/post/${post.slug}`} className="relative block overflow-hidden" aria-label={`Leer ${post.title}`}>
                  <img
                    src={getPostImage({ image: post.image, slug: post.slug ?? post.id, width: 640, height: 360 })}
                    alt={post.imageAlt ?? `Imagen ilustrativa para ${post.title}`}
                    loading="lazy"
                    className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-sm font-medium uppercase tracking-wide text-sky-500">
                    {post.categories?.[0] ?? 'Blog'}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900 transition-colors group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300">
                    <Link to={`/post/${post.slug}`}>
                      <span className="absolute inset-0" aria-hidden="true" />
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">{post.excerpt ?? post.summary}</p>
                  <div className="mt-6 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                    <span>{post.author?.name ?? 'Equipo Codex'}</span>
                    <time dateTime={post.created_at ?? post.publishedAt}>{formatDate(post.created_at ?? post.publishedAt)}</time>
                  </div>
                </div>
              </motion.article>
            ))}
      </motion.div>

      {isEmpty ? (
        <div className="mt-12 rounded-3xl border border-dashed border-slate-300 bg-white/60 p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
          <p>No hay publicaciones disponibles todavía. Vuelve pronto para descubrir nuevos contenidos.</p>
        </div>
      ) : null}
    </section>
  );
}

export default memo(LatestPosts);
