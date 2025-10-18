import { useMemo } from 'react';
import { Link, generatePath } from 'react-router-dom';
import { Badge } from 'flowbite-react';
import { m } from 'framer-motion';
import { CalendarDaysIcon, ArrowUpRightIcon } from '@heroicons/react/24/outline';

const FALLBACK_DESCRIPTION =
  'Explora los detalles completos de esta publicación y descubre recursos adicionales dentro del artículo.';

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const timelineVariantsFactory = (prefersReducedMotion) => ({
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 32
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0.3 : 0.55,
      ease: [0.22, 1, 0.36, 1]
    }
  }
});

function TimelineItem({ post, position = 'left', prefersReducedMotion = false }) {
  const slug = post?.slug ?? post?.id ?? '';
  const detailPath = slug ? generatePath('/post/:slug', { slug }) : '#';
  const title = post?.title ?? 'Publicación sin título';
  const imageUrl = post?.thumb || post?.image || post?.thumbnail;
  const imageAlt = post?.imageAlt || `Ilustración representativa de ${title}`;
  const description = post?.excerpt || FALLBACK_DESCRIPTION;
  const dateValue = post?.date || post?.created_at || post?.published_at;
  const formattedDate = useMemo(() => formatDate(dateValue), [dateValue]);
  const author = post?.author || '';
  const categories = useMemo(() => {
    if (Array.isArray(post?.categories_detail) && post.categories_detail.length > 0) {
      return post.categories_detail.map((category) => category?.name || category?.slug).filter(Boolean);
    }
    if (Array.isArray(post?.categories) && post.categories.length > 0) {
      return post.categories.map((category) =>
        typeof category === 'string' ? category : category?.name || category?.slug
      );
    }
    return [];
  }, [post]);
  const primaryCategory = categories[0] ?? 'Sin categoría';

  const isLeft = position === 'left';

  const variants = useMemo(
    () => timelineVariantsFactory(prefersReducedMotion),
    [prefersReducedMotion]
  );

  const metaClasses = [
    'order-1 mb-4 flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400',
    isLeft ? 'lg:col-start-1 lg:order-1 lg:items-end lg:text-right' : 'lg:col-start-3 lg:order-3 lg:items-start lg:text-left'
  ].join(' ');

  const cardClasses = [
    'order-2',
    isLeft ? 'lg:col-start-3 lg:order-2' : 'lg:col-start-1 lg:order-2'
  ].join(' ');

  return (
    <m.div
      variants={variants}
      className="relative pl-12 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-12 lg:pl-0"
    >
      <span
        className="pointer-events-none absolute left-4 top-6 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-sky-500 bg-white shadow-md transition-colors duration-300 dark:border-sky-400 dark:bg-slate-950 lg:left-1/2 lg:-translate-x-1/2"
      >
        <span className="block h-2 w-2 rounded-full bg-sky-500 dark:bg-sky-300" />
      </span>
      <div className={metaClasses}>
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Publicado
        </span>
        <time dateTime={dateValue ?? undefined} className="text-base font-semibold text-slate-800 dark:text-slate-100">
          {formattedDate || 'Fecha no disponible'}
        </time>
        {author ? <span className="text-sm text-slate-500 dark:text-slate-400">Por {author}</span> : null}
      </div>
      <div className="order-2 hidden lg:col-start-2 lg:order-2 lg:flex lg:h-full lg:items-stretch lg:justify-center">
        <span aria-hidden="true" className="block w-px bg-slate-200 dark:bg-slate-700" />
      </div>
      <article className={cardClasses}>
        <Link
          to={detailPath}
          className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-lg transition duration-300 hover:border-sky-300 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-4 dark:border-slate-800/70 dark:bg-slate-900/60 dark:hover:border-sky-500/60 dark:focus-visible:outline-sky-300"
          aria-label={`Abrir publicación: ${title}`}
        >
          {imageUrl ? (
            <div className="relative mb-4 overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt={imageAlt}
                loading="lazy"
                className="h-48 w-full object-cover transition duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
            </div>
          ) : null}
          <div className="flex flex-1 flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 shadow-sm transition-colors duration-200 group-hover:border-cyan-400 group-hover:bg-cyan-100 dark:border-cyan-500/40 dark:bg-cyan-900/40 dark:text-cyan-200 dark:group-hover:border-cyan-400"
              >
                <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />
                {primaryCategory}
              </span>
            </div>
            <h3 className="text-2xl font-semibold leading-tight text-slate-900 transition-colors duration-300 group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300">
              {title}
            </h3>
            <p className="text-base leading-relaxed text-slate-600 transition-colors duration-300 dark:text-slate-300">
              {description}
            </p>
            <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-sky-600 transition-colors duration-300 group-hover:text-sky-500 dark:text-sky-300 dark:group-hover:text-sky-200">
              Leer artículo
              <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </Link>
      </article>
    </m.div>
  );
}

export default TimelineItem;
