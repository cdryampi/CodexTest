import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { m, useReducedMotion } from 'framer-motion';
import MotionProvider from '../components/motion/MotionProvider';
import AnimatedPostCard from '../components/motion/AnimatedPostCard';
import TimelineItem from '../components/timeline/TimelineItem';
import { listPosts } from '../api';
import {
  buildPageTitle,
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_CARD,
  sanitizeMetaText
} from '../seo/config.js';

const TIMELINE_TITLE = 'Cronología de publicaciones';
const TIMELINE_DESCRIPTION =
  'Sigue la evolución de nuestro blog con una línea temporal interactiva y descubre los artículos más destacados.';
const ERROR_MESSAGE =
  'No pudimos cargar la cronología en este momento. Revisa tu conexión o inténtalo nuevamente en unos segundos.';

const timelineContainerFactory = (prefersReducedMotion) => ({
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.12,
      delayChildren: prefersReducedMotion ? 0 : 0.1
    }
  }
});

const MAX_PAGE_SIZE = 60;

function Timeline() {
  const [state, setState] = useState({ posts: [], loading: true, error: null });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));
        const response = await listPosts({
          page: 1,
          pageSize: MAX_PAGE_SIZE,
          ordering: '-date',
          signal: controller.signal
        });
        if (!isMounted) {
          return;
        }
        setState({ posts: response?.results ?? [], loading: false, error: null });
      } catch (error) {
        if (error?.name === 'AbortError') {
          return;
        }
        if (!isMounted) {
          return;
        }
        setState({ posts: [], loading: false, error: ERROR_MESSAGE });
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const featuredPosts = useMemo(
    () => state.posts.filter((post) => Boolean(post?.featured)),
    [state.posts]
  );

  const timelinePosts = useMemo(() => {
    if (!state.posts.length) {
      return [];
    }
    return [...state.posts].sort((a, b) => {
      const aDate = new Date(a?.date || a?.created_at || a?.published_at || 0).getTime();
      const bDate = new Date(b?.date || b?.created_at || b?.published_at || 0).getTime();
      return bDate - aDate;
    });
  }, [state.posts]);

  const timelineVariants = useMemo(
    () => timelineContainerFactory(prefersReducedMotion),
    [prefersReducedMotion]
  );

  const pageTitle = buildPageTitle(TIMELINE_TITLE);
  const metaDescription = sanitizeMetaText(TIMELINE_DESCRIPTION);

  const showSkeleton = state.loading && timelinePosts.length === 0;
  const showErrorMessage = state.error && timelinePosts.length === 0;

  return (
    <MotionProvider>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={TIMELINE_TITLE} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content={DEFAULT_TWITTER_CARD} />
        <meta name="twitter:title" content={TIMELINE_TITLE} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Helmet>
      <div className="space-y-16">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500/10 via-transparent to-blue-500/10 p-10 shadow-xl ring-1 ring-slate-200/60 transition-colors duration-500 dark:from-sky-500/10 dark:via-slate-900/40 dark:to-blue-500/10 dark:ring-slate-800/60">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
            <m.span
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.25 : 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700 shadow-sm backdrop-blur dark:bg-slate-900/60 dark:text-sky-300"
            >
              Línea temporal
            </m.span>
            <m.h1
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.35 : 0.7, ease: [0.22, 1, 0.36, 1], delay: prefersReducedMotion ? 0 : 0.05 }}
              className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl dark:text-white"
            >
              {TIMELINE_TITLE}
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0.35 : 0.7, ease: [0.22, 1, 0.36, 1], delay: prefersReducedMotion ? 0 : 0.12 }}
              className="text-lg leading-relaxed text-slate-600 dark:text-slate-300"
            >
              {TIMELINE_DESCRIPTION}
            </m.p>
          </div>
        </section>

        {featuredPosts.length > 0 ? (
          <section className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Destacados recientes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Una selección curada de artículos imperdibles para ponerte al día.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredPosts.map((post, index) => {
                const key = post?.slug || post?.id;
                return <AnimatedPostCard key={key ?? `featured-${index}`} post={post} />;
              })}
            </div>
          </section>
        ) : null}

        <section className="space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Línea temporal completa</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Explora cada publicación en orden cronológico inverso con una presentación adaptada a cualquier dispositivo.
            </p>
          </header>

          {showSkeleton ? (
            <div className="space-y-10">
              <div className="h-40 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
              <div className="h-40 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
              <div className="h-40 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800/60" />
            </div>
          ) : showErrorMessage ? (
            <div
              role="status"
              className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-red-800 shadow-sm dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"
            >
              <p className="font-semibold">{ERROR_MESSAGE}</p>
            </div>
          ) : timelinePosts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-6 text-center text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
              Aún no hay publicaciones disponibles para mostrar en la cronología.
            </div>
          ) : (
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute left-4 top-0 h-full w-px bg-slate-200 dark:bg-slate-700 lg:hidden"
              />
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-slate-200 dark:bg-slate-700 lg:block"
              />
              <m.div
                variants={timelineVariants}
                initial="hidden"
                animate="show"
                className="space-y-16"
              >
                {timelinePosts.map((post, index) => {
                  const key = post?.slug || post?.id || `timeline-${index}`;
                  return (
                    <TimelineItem
                      key={key}
                      post={post}
                      position={index % 2 === 0 ? 'left' : 'right'}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  );
                })}
              </m.div>
            </div>
          )}
        </section>
      </div>
    </MotionProvider>
  );
}

export default Timeline;
