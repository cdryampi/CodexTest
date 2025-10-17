import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, Card } from 'flowbite-react';
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
      <Card className="border border-red-200 bg-white shadow-sm">
        <h2 className="text-2xl font-semibold text-red-700">Publicación no encontrada</h2>
        <p className="text-slate-600">
          La publicación que buscas no existe o fue movida. Regresa al inicio para seguir explorando.
        </p>
        <Button color="light" onClick={() => navigate('/')}>Volver al inicio</Button>
      </Card>
    );
  }

  return (
    <article className="space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {post.etiquetas.map((tag) => (
            <Badge key={tag} color="info">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="text-4xl font-bold text-slate-900">{post.titulo}</h1>
        <p className="text-sm text-slate-500">
          Escrito por {post.autor} el{' '}
          {new Date(post.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}
        </p>
      </header>

      <section className="space-y-4 text-lg leading-relaxed text-slate-700">
        {post.contenido.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </section>

      <footer className="space-y-6">
        <Button color="light" onClick={() => navigate(-1)}>
          ← Volver
        </Button>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            Comentarios ({postComments.length})
          </h2>
          {postComments.length === 0 ? (
            <p className="text-slate-600">
              Aún no hay comentarios. ¡Sé la primera persona en compartir tus ideas!
            </p>
          ) : (
            <div className="space-y-4">
              {postComments.map((comment) => (
                <Card key={comment.id} className="border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      {comment.autor}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(comment.fecha).toLocaleDateString('es-ES', { dateStyle: 'medium' })}
                    </span>
                  </div>
                  <p className="mt-2 text-slate-600">{comment.contenido}</p>
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
