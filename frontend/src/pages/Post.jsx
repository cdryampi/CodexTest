import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button } from 'flowbite-react';
import {
  ArrowLeftIcon,
  CalendarIcon,
  Squares2X2Icon,
  TagIcon
} from '@heroicons/react/24/outline';
import { getPost, listComments } from '../api';
import CommentsSection from '../components/CommentsSection';
import Skeleton from '../components/common/Skeleton';
import ReadingProgress from '../components/post/ReadingProgress';

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

function Post() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [postState, setPostState] = useState({ data: null, loading: true, error: null, notFound: false });
  const [postToken, setPostToken] = useState(0);
  const [commentsState, setCommentsState] = useState({ items: [], loading: true, error: null, token: 0 });

  const fetchPost = useCallback(
    async (controller) => {
      setPostState((prev) => ({ ...prev, loading: true, error: null, notFound: false }));
      if (!slug) {
        setPostState({ data: null, loading: false, error: null, notFound: true });
        return;
      }
      try {
        const data = await getPost(slug, { signal: controller.signal });
        setPostState({ data, loading: false, error: null, notFound: false });
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        if (error.status === 404) {
          setPostState({ data: null, loading: false, error: null, notFound: true });
        } else {
          setPostState({ data: null, loading: false, error, notFound: false });
        }
      }
    },
    [slug]
  );

  const fetchComments = useCallback(
    async (controller) => {
      setCommentsState((prev) => ({ ...prev, loading: true, error: null }));
      if (!slug) {
        setCommentsState((prev) => ({ ...prev, items: [], loading: false, error: null }));
        return;
      }

      try {
        const items = await listComments(slug, { signal: controller.signal });
        setCommentsState((prev) => ({ ...prev, items, loading: false, error: null }));
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setCommentsState((prev) => ({ ...prev, loading: false, error }));
      }
    },
    [slug]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchPost(controller);
    return () => controller.abort();
  }, [fetchPost, postToken]);

  useEffect(() => {
    const controller = new AbortController();
    fetchComments(controller);
    return () => controller.abort();
  }, [fetchComments, commentsState.token]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [slug]);

  const post = postState.data;
  const categories = useMemo(() => {
    if (!post) {
      return [];
    }
    if (Array.isArray(post.categories_detail) && post.categories_detail.length > 0) {
      return post.categories_detail;
    }
    if (Array.isArray(post.categories)) {
      return post.categories.map((category) => ({ slug: category, name: category }));
    }
    return [];
  }, [post]);
  const paragraphs = useMemo(() => {
    if (!post?.content) {
      return [];
    }
    return post.content
      .split('\n\n')
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0);
  }, [post]);

  const handleRetryPost = () => {
    setPostToken((value) => value + 1);
  };

  const handleRetryComments = () => {
    setCommentsState((prev) => ({ ...prev, token: prev.token + 1 }));
  };

  const handleRefreshComments = () => {
    setCommentsState((prev) => ({ ...prev, token: prev.token + 1 }));
  };

  if (postState.loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="card" />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  if (postState.notFound) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Publicación no encontrada</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          No logramos encontrar esta entrada. Puede que haya sido movida o eliminada.
        </p>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => navigate('/')} color="light" className="inline-flex items-center gap-2">
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  if (postState.error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-red-700 shadow-sm dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
        <h2 className="text-2xl font-semibold">Ocurrió un error al cargar la publicación.</h2>
        <p className="mt-2 text-sm opacity-80">{postState.error.message || 'Inténtalo nuevamente más tarde.'}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button color="light" onClick={() => navigate('/')} className="inline-flex items-center gap-2">
            <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
            Volver al inicio
          </Button>
          <Button color="failure" onClick={handleRetryPost}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <article className="relative space-y-12">
      <ReadingProgress />

      <div className="pointer-events-none sticky top-24 z-40 flex justify-start">
        <Button
          color="light"
          onClick={() => navigate('/')}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-slate-900/5 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Volver
        </Button>
      </div>

      <header className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-sm transition duration-300 dark:border-slate-800 dark:shadow-slate-900/40">
        {post.image ? (
          <img
            src={post.image}
            alt={post.imageAlt || (post.title ? `Imagen de portada para ${post.title}` : 'Imagen representativa de la publicación')}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/40 via-slate-900/50 to-slate-900/70 dark:from-sky-400/30 dark:via-slate-950/70 dark:to-slate-950/90" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-900/70 dark:from-slate-950/90 dark:via-slate-950/60 dark:to-slate-950/80" aria-hidden="true" />
        <div className="relative flex min-h-[22rem] flex-col justify-end gap-6 px-6 py-16 sm:px-12">
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-200">
            <CalendarIcon className="h-5 w-5" aria-hidden="true" />
            <span>{formatDate(post.created_at)}</span>
          </div>
          <h1 className="text-4xl font-bold text-white drop-shadow-md sm:text-5xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap gap-2">
            {categories.length > 0 ? (
              categories.map((category, index) => {
                const key = category.slug ?? category.name ?? `category-${index}`;
                return (
                  <Badge
                    key={key}
                    color="purple"
                    className="border border-white/40 bg-white/15 text-white backdrop-blur"
                  >
                    <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
                    {category.name ?? category.slug ?? 'Categoría sin nombre'}
                  </Badge>
                );
              })
            ) : (
              <Badge color="gray" className="border border-white/40 bg-white/10 text-white/80">
                <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
                Esta publicación aún no tiene categorías asignadas
              </Badge>
            )}
          </div>
        </div>
      </header>

      {post.tags?.length ? (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              color="info"
              className="flex items-center gap-1 bg-sky-100 text-sky-700 transition-colors duration-300 dark:bg-sky-900/60 dark:text-sky-200"
            >
              <TagIcon className="h-4 w-4" aria-hidden="true" />
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      <section className="space-y-6 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </section>

      <footer className="space-y-10">
        <CommentsSection
          slug={slug}
          comments={commentsState.items}
          loading={commentsState.loading}
          error={commentsState.error}
          onRetry={handleRetryComments}
          onRefresh={handleRefreshComments}
        />
      </footer>
    </article>
  );
}

export default Post;
