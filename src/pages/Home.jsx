import { Card, Badge } from 'flowbite-react';
import { Link } from 'react-router-dom';
import posts from '../data/posts.json';

function Home() {
  return (
    <section className="space-y-10">
      <header className="space-y-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
          Blog tecnológico en español
        </p>
        <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">
          Ideas frescas para construir interfaces modernas
        </h1>
        <p className="mx-auto max-w-2xl text-base text-slate-600">
          Explora artículos pensados para acelerar tus proyectos con React, Tailwind CSS y Flowbite. Cada publicación incluye consejos prácticos y buenas prácticas listas para aplicar hoy mismo.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <Card
            key={post.id}
            className="flex h-full flex-col justify-between border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {post.etiquetas.map((tag) => (
                  <Badge key={tag} color="info">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">{post.titulo}</h2>
              <p className="text-sm text-slate-500">
                Publicado por {post.autor} el {new Date(post.fecha).toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </p>
              <p className="text-base text-slate-600">{post.resumen}</p>
            </div>
            <div className="pt-4">
              <Link
                to={`/post/${post.id}`}
                className="inline-flex items-center text-sm font-semibold text-sky-600 hover:text-sky-700"
              >
                Leer artículo completo
                <span className="ml-1" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <section id="acerca" className="rounded-2xl bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Sobre este blog</h2>
        <p className="mt-3 text-slate-600">
          Este proyecto demuestra cómo combinar React con Tailwind CSS, Flowbite y React Router para construir un blog estático moderno. Utiliza datos locales en formato JSON y está preparado para desplegarse automáticamente en GitHub Pages mediante GitHub Actions.
        </p>
      </section>
    </section>
  );
}

export default Home;
