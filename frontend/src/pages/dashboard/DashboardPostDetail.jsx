import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import { getPost } from '../../services/api.js';
import { Button } from '../../components/ui/button.jsx';

function DashboardPostDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { setHeader } = useDashboardLayout();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setHeader({
      title: 'Detalle del post',
      description: 'Vista previa del contenido publicado.',
      showSearch: false,
      actions: (
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/posts')}>
            Volver al listado
          </Button>
          <Button type="button" onClick={() => navigate(`/dashboard/posts/${slug}/edit`)}>
            Editar post
          </Button>
        </div>
      )
    });
  }, [navigate, setHeader, slug]);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        navigate('/dashboard/posts', { replace: true });
        return;
      }
      try {
        const data = await getPost(slug);
        setPost(data);
      } catch (error) {
        navigate('/dashboard/posts', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [navigate, slug]);

  const formattedDate = useMemo(() => {
    if (!post?.created_at) {
      return 'Sin fecha';
    }
    const date = new Date(post.created_at);
    if (Number.isNaN(date.getTime())) {
      return 'Sin fecha';
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(date);
  }, [post?.created_at]);

  const safeContent = useMemo(() => {
    const raw = post?.content ?? '';
    const sanitized = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    return sanitized || '<p>Sin contenido.</p>';
  }, [post?.content]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500 dark:text-slate-400">
        <span className="animate-pulse text-sm">Cargando post...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-400">
        No encontramos la publicación solicitada.
      </div>
    );
  }

  return (
    <article className="space-y-6 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{post.title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span>{post.author ?? 'Autor desconocido'}</span>
          <span className="mx-2">•</span>
          <span>{formattedDate}</span>
        </p>
        <p className="text-base text-slate-600 dark:text-slate-300">{post.excerpt}</p>
        <div className="flex flex-wrap items-center gap-2">
          {Array.isArray(post.categories_detail) && post.categories_detail.length > 0 ? (
            post.categories_detail.map((category) => (
              <span
                key={category.slug ?? category.name}
                className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
              >
                {category.name ?? category.slug}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400">Sin categorías</span>
          )}
        </div>
      </header>
      {post.image ? (
        <img
          src={post.image}
          alt={post.imageAlt ?? 'Imagen del post'}
          className="w-full rounded-3xl object-cover"
        />
      ) : null}
      <section className="prose prose-slate max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: safeContent }} />
      <footer className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {Array.isArray(post.tags) && post.tags.length > 0 ? (
          post.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-1 text-xs font-medium text-sky-600 dark:bg-sky-500/20 dark:text-sky-300"
            >
              #{tag}
            </span>
          ))
        ) : (
          <span className="text-xs text-slate-400">Sin etiquetas</span>
        )}
      </footer>
    </article>
  );
}

export default DashboardPostDetail;
