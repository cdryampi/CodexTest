import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from 'flowbite-react';
import {
  ArrowLeftIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  TagIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import posts from '../data/posts.json';
import comments from '../data/comments.json';

function Post() {
  const { postId } = useParams();
  const navigate = useNavigate();

  const post = useMemo(() => posts.find((item) => item.id === postId), [postId]);
  const postComments = useMemo(
    () => comments.filter((comment) => comment.postId === postId),
    [postId]
  );

  if (!post) {
    return (
      <Card className="border border-red-200 bg-white shadow-sm dark:border-red-400/40 dark:bg-red-950/30">
        <h2 className="text-2xl font-semibold text-red-700 dark:text-red-300">Publicación no encontrada</h2>
        <p className="text-slate-600 dark:text-slate-300">
          La publicación que buscas no existe o fue movida. Regresa al inicio para seguir explorando.
        </p>
        <Button
          color="light"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Volver al inicio
        </Button>
      </Card>
    );
  }

  return (
    <article className="space-y-12">
      <header className="space-y-6">
        <figure className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm transition duration-300 dark:border-slate-800 dark:shadow-slate-900/40">
          <img
            src={post.image ?? post.imagen}
            alt={post.imageAlt ?? post.imagenAlt}
            className="h-72 w-full object-cover transition duration-500 hover:scale-[1.02]"
            loading="lazy"
          />
        </figure>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
              {post.autor}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              <ClockIcon className="h-5 w-5" aria-hidden="true" />
              {new Date(post.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 dark:text-sky-300">
              <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
              {postComments.length} comentarios
            </span>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 transition-colors duration-300 dark:text-white">
            {post.titulo}
          </h1>
          <div className="flex flex-wrap gap-2">
            {post.etiquetas.map((tag) => (
              <Badge
                key={tag}
                color="info"
                className="flex items-center gap-1 bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-200"
              >
                <TagIcon className="h-4 w-4" aria-hidden="true" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <section className="space-y-6 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
        {post.contenido.map((paragraph, index) => (
          <p key={index} className="transition duration-300">
            {paragraph}
          </p>
        ))}
      </section>

      <footer className="space-y-8">
        <Button
          color="light"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition duration-300 hover:-translate-y-0.5 hover:border-sky-500 hover:text-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-400 dark:hover:text-sky-300 dark:focus-visible:ring-offset-slate-900"
        >
          <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
          Volver a la página anterior
        </Button>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900 transition-colors duration-300 dark:text-white">
            Comentarios ({postComments.length})
          </h2>
          {postComments.length === 0 ? (
            <p className="text-slate-600 dark:text-slate-400">
              Aún no hay comentarios. ¡Sé la primera persona en compartir tus ideas!
            </p>
          ) : (
            <div className="space-y-4">
              {postComments.map((comment) => (
                <Card
                  key={comment.id}
                  className="border border-slate-200 bg-white/90 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-sky-400/50"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                      <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
                      {comment.autor}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <ClockIcon className="h-4 w-4" aria-hidden="true" />
                      {new Date(comment.fecha).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <p className="mt-1 text-slate-600 dark:text-slate-300">{comment.contenido}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      </footer>
    </article>
  );
}

export default Post;
