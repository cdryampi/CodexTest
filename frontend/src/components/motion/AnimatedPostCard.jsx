import { useMemo, useState } from 'react';
import { Link, generatePath } from 'react-router-dom';
import { Badge } from 'flowbite-react';
import {
  ArrowRightIcon,
  CalendarIcon,
  ClockIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';
import { m, useReducedMotion } from 'framer-motion';
import Skeleton from '../common/Skeleton';
import useInViewOnce from '../../hooks/useInViewOnce';

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

const estimateReadingMinutes = (text = '', fallback = 4) => {
  const words = text
    .toString()
    .split(/\s+/)
    .filter(Boolean).length;
  if (!words) {
    return fallback;
  }
  return Math.max(1, Math.round(words / 190));
};

const itemVariantsFactory = (prefersReducedMotion) => ({
  hidden: {
    opacity: 0,
    y: prefersReducedMotion ? 0 : 16
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0.25 : 0.35,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  hover: prefersReducedMotion
    ? {
        scale: 1
      }
    : {
        scale: 1.02,
        transition: {
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1]
        }
      },
  tap: prefersReducedMotion
    ? {
        scale: 1
      }
    : {
        scale: 0.99,
        transition: {
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1]
        }
      }
});

const imageVariantsFactory = (prefersReducedMotion) => ({
  hidden: {
    opacity: 0.4,
    scale: 1,
    y: 0
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: prefersReducedMotion ? 0.2 : 0.45,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  hover: prefersReducedMotion
    ? {
        scale: 1,
        y: 0
      }
    : {
        scale: 1.03,
        y: -4,
        transition: {
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1]
        }
      },
  tap: prefersReducedMotion
    ? {
        scale: 1
      }
    : {
        scale: 1.01
      }
});

function AnimatedPostCard({ post }) {
  const prefersReducedMotion = useReducedMotion();
  const [cardRef, cardInView] = useInViewOnce({ rootMargin: '0px 0px -10% 0px' });

  const [imageLoaded, setImageLoaded] = useState(() => {
    const url = post?.image || post?.thumb || post?.thumbnail;
    return !url;
  });

  const title = post?.title ?? 'Artículo sin título';
  const slug = post?.slug ?? post?.id;
  const detailPath = slug ? generatePath('/post/:slug', { slug }) : '#';
  const imageUrl = post?.image || post?.thumb || post?.thumbnail;
  const imageAlt = post?.imageAlt || (title ? `Imagen representativa de ${title}` : 'Imagen ilustrativa');
  const dateValue = post?.date || post?.created_at || post?.published_at;
  const formattedDate = useMemo(() => formatDate(dateValue), [dateValue]);

  const readingMinutes = useMemo(
    () => estimateReadingMinutes(post?.excerpt || post?.content || title),
    [post, title]
  );

  const categories = useMemo(() => {
    if (Array.isArray(post?.categories_detail) && post.categories_detail.length > 0) {
      return post.categories_detail;
    }
    if (Array.isArray(post?.categories) && post.categories.length > 0) {
      return post.categories.map((category) =>
        typeof category === 'string' ? { slug: category, name: category } : category
      );
    }
    return [];
  }, [post]);

  const primaryCategory = categories[0]?.name || categories[0]?.slug || 'Sin categoría';

  const itemVariants = useMemo(() => itemVariantsFactory(prefersReducedMotion), [prefersReducedMotion]);
  const imageVariants = useMemo(
    () => imageVariantsFactory(prefersReducedMotion),
    [prefersReducedMotion]
  );

  const handleKeyDown = (event) => {
    if (event.key === ' ') {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  return (
    <m.article
      ref={cardRef}
      variants={itemVariants}
      initial="hidden"
      animate={cardInView ? 'visible' : 'hidden'}
      whileHover="hover"
      whileTap="tap"
      className="h-full"
    >
      <Link
        to={detailPath}
        aria-label={`Abrir artículo: ${title}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-xl transition-all duration-300 hover:shadow-2xl hover:ring-1 hover:ring-cyan-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-800/70 dark:bg-slate-900/50 dark:hover:ring-cyan-500/40 dark:focus-visible:ring-offset-slate-950"
        onKeyDown={handleKeyDown}
      >
        <div className="relative overflow-hidden rounded-xl">
          <div className="aspect-[16/9] w-full">
            {!imageLoaded ? (
              <div className="absolute inset-0">
                <Skeleton variant="media" />
              </div>
            ) : null}
            {imageUrl ? (
              <m.img
                src={imageUrl}
                alt={imageAlt}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                className={`h-full w-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                variants={imageVariants}
                initial="hidden"
                animate={imageLoaded ? 'visible' : 'hidden'}
              />
            ) : (
              <div className="h-full w-full rounded-xl bg-slate-200/80 dark:bg-slate-700/70" />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4 text-white">
              <span className="text-sm font-medium text-slate-200/90">{formattedDate}</span>
              <h2 className="text-xl font-semibold leading-tight text-white drop-shadow-[0_2px_6px_rgba(15,23,42,0.45)]">
                {title}
              </h2>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex flex-wrap gap-2">
            <Badge
              color="gray"
              className="inline-flex items-center gap-1 rounded-full border border-slate-300/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition-colors duration-200 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-300"
            >
              <ClockIcon className="h-4 w-4" aria-hidden="true" />
              {`${readingMinutes} min de lectura`}
            </Badge>
            <Badge
              color="info"
              className="inline-flex items-center gap-1 rounded-full border border-cyan-300/60 bg-cyan-100/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 shadow-sm transition-colors duration-200 dark:border-cyan-500/40 dark:bg-cyan-900/40 dark:text-cyan-200"
            >
              <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
              {primaryCategory}
            </Badge>
          </div>
          {post?.excerpt ? (
            <p className="max-h-24 overflow-hidden text-sm leading-relaxed text-slate-600 transition-colors duration-300 dark:text-slate-300">
              {post.excerpt}
            </p>
          ) : (
            <p className="text-sm text-slate-600 transition-colors duration-300 dark:text-slate-300">
              Descubre los detalles y ejemplos prácticos dentro del artículo.
            </p>
          )}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2 text-sm">
            <div className="inline-flex items-center gap-2 text-slate-500 transition-colors duration-300 dark:text-slate-400">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              <span>{formattedDate || 'Fecha no disponible'}</span>
            </div>
            <span className="inline-flex items-center gap-2 font-semibold text-cyan-600 transition-colors duration-300 group-hover:text-cyan-500 dark:text-cyan-300 dark:group-hover:text-cyan-200">
              Leer artículo
              <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </m.article>
  );
}

export default AnimatedPostCard;
