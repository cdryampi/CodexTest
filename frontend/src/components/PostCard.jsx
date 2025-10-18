import { Link, generatePath } from 'react-router-dom';
import { Badge } from 'flowbite-react';
import { ArrowRightIcon, CalendarIcon, TagIcon, Squares2X2Icon } from '@heroicons/react/24/outline';

const formatDate = (dateString) => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const estimateReadingMinutes = (text = '') => {
  const words = text
    .toString()
    .split(/\s+/)
    .filter(Boolean).length;
  if (!words) {
    return 1;
  }
  return Math.max(1, Math.round(words / 180));
};

const truncateText = (text = '', maxLength = 180) => {
  const trimmed = text.toString().trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
};

function PostCard({ post }) {
  if (!post) {
    return null;
  }

  const { slug, title, excerpt, tags = [], created_at: createdAt } = post;
  const thumbnail = post.thumbnail ?? post.image ?? null;
  const readingMinutes = estimateReadingMinutes(excerpt || title);
  const displayExcerpt = truncateText(excerpt);
  const detailPath = slug ? generatePath('/post/:slug', { slug }) : '#';
  const categories = Array.isArray(post.categories_detail) && post.categories_detail.length > 0
    ? post.categories_detail
    : Array.isArray(post.categories)
      ? post.categories.map((category) => ({ slug: category, name: category }))
      : [];

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-lg/40 ring-1 ring-transparent transition duration-300 hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl hover:ring-sky-100 focus-within:-translate-y-1 focus-within:border-sky-300 focus-within:ring-sky-100 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-sky-500/60 dark:hover:shadow-sky-900/40 dark:hover:ring-sky-500/20">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-fuchsia-500 to-sky-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden="true"
      />
      {thumbnail ? (
        <Link to={detailPath} className="relative block overflow-hidden">
          <img
            src={thumbnail}
            alt={title ? `Imagen ilustrativa para ${title}` : 'Imagen representativa de la publicación'}
            className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-80"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm dark:bg-slate-900/80 dark:text-slate-200"
            aria-hidden="true"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatDate(createdAt)}</span>
          </div>
        </Link>
      ) : (
        <div
          className="flex h-2 items-center justify-between bg-gradient-to-r from-sky-100 via-transparent to-sky-100 px-6 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800"
          aria-hidden="true"
        >
          <span className="h-1 w-10 rounded-full bg-sky-300/70 dark:bg-sky-500/50" />
          <span className="h-1 w-16 rounded-full bg-fuchsia-300/70 dark:bg-fuchsia-500/40" />
          <span className="h-1 w-8 rounded-full bg-sky-300/70 dark:bg-sky-500/50" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-5 p-6">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" aria-hidden="true" />
              <span>{formatDate(createdAt)}</span>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700 shadow-sm dark:bg-sky-900/70 dark:text-sky-200">
              {readingMinutes} min de lectura
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
            {categories.length > 0 ? (
              categories.map((category, index) => {
                const key = category.slug ?? category.name ?? `category-${index}`;
                return (
                  <Badge
                    key={key}
                    color="purple"
                    className="inline-flex items-center gap-1 border border-fuchsia-200/60 bg-fuchsia-100/80 text-fuchsia-700 shadow-sm transition-colors duration-200 hover:border-fuchsia-400 hover:bg-fuchsia-50 hover:text-fuchsia-600 dark:border-fuchsia-500/40 dark:bg-fuchsia-900/40 dark:text-fuchsia-200 dark:hover:border-fuchsia-400/70 dark:hover:bg-fuchsia-900/60"
                  >
                    <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
                    {category.name ?? category.slug ?? 'Categoría sin nombre'}
                  </Badge>
                );
              })
            ) : (
              <Badge
                color="gray"
                className="inline-flex items-center gap-1 border border-slate-200/60 bg-slate-200/70 text-slate-600 dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300"
              >
                <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
                Sin categorías asignadas
              </Badge>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300">
            <Link
              to={detailPath}
              className="relative inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <span className="absolute inset-0" aria-hidden="true" />
              {title}
            </Link>
          </h2>
        </header>
        <p className="text-base leading-relaxed text-slate-600 transition-colors duration-300 dark:text-slate-300">
          {displayExcerpt}
        </p>
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                color="info"
                className="inline-flex items-center gap-1 border border-sky-200/60 bg-sky-100/80 text-sky-700 shadow-sm transition-colors duration-200 hover:border-sky-400 hover:bg-sky-50 hover:text-sky-600 dark:border-sky-500/40 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:border-sky-400/70 dark:hover:bg-sky-900/60"
              >
                <TagIcon className="h-4 w-4" aria-hidden="true" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200">Explora este contenido</span>
            <p>Profundiza en buenas prácticas listas para aplicar.</p>
          </div>
          <Link
            to={detailPath}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
          >
            Leer artículo
            <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default PostCard;
