import { Link } from 'react-router-dom';
import { Badge } from 'flowbite-react';
import { CalendarIcon, TagIcon } from '@heroicons/react/24/outline';

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

function PostCard({ post }) {
  if (!post) {
    return null;
  }

  const { slug, title, excerpt, tags = [], created_at: createdAt, image } = post;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg focus-within:-translate-y-1 focus-within:shadow-lg dark:border-slate-800 dark:bg-slate-900/70 dark:hover:shadow-slate-900/50">
      {image ? (
        <Link to={`/post/${slug}`} className="relative block h-56 overflow-hidden">
          <img
            src={image}
            alt={`Imagen de portada para ${title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <CalendarIcon className="h-4 w-4" aria-hidden="true" />
            <span>{formatDate(createdAt)}</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-sky-600 dark:text-white dark:group-hover:text-sky-300">
            <Link to={`/post/${slug}`} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
              {title}
            </Link>
          </h2>
        </header>
        <p className="text-base text-slate-600 dark:text-slate-300">{excerpt}</p>
        {tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-2">
            {tags.map((tag) => (
              <Badge
                key={tag}
                color="info"
                className="inline-flex items-center gap-1 border border-sky-200/60 bg-sky-100 text-sky-700 dark:border-sky-500/40 dark:bg-sky-900/40 dark:text-sky-200"
              >
                <TagIcon className="h-4 w-4" aria-hidden="true" />
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default PostCard;
