import { useState } from 'react';
import { Textarea, TextInput, Button, Spinner } from 'flowbite-react';
import { createComment } from '../api';

const MAX_LENGTH = 2000;

function CommentForm({ slug, onSuccess, onError }) {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = authorName.trim();
    const trimmedContent = content.trim();

    if (!trimmedName || !trimmedContent) {
      setFormError('Completa tu nombre y comentario antes de enviarlo.');
      return;
    }

    if (trimmedContent.length > MAX_LENGTH) {
      setFormError(`El comentario debe tener menos de ${MAX_LENGTH} caracteres.`);
      return;
    }

    setSubmitting(true);

    try {
      await createComment(slug, {
        author_name: trimmedName,
        content: trimmedContent
      });
      setAuthorName('');
      setContent('');
      onSuccess?.();
    } catch (error) {
      setFormError(error.message || 'No se pudo enviar el comentario.');
      onError?.(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="comment-author" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Nombre
        </label>
        <TextInput
          id="comment-author"
          value={authorName}
          onChange={(event) => setAuthorName(event.target.value)}
          placeholder="Tu nombre"
          required
          disabled={submitting}
          aria-required="true"
        />
      </div>
      <div>
        <label htmlFor="comment-content" className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Comentario
        </label>
        <Textarea
          id="comment-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Comparte tus ideas y preguntas"
          rows={4}
          required
          maxLength={MAX_LENGTH}
          disabled={submitting}
          aria-required="true"
        />
        <div className="mt-1 text-right text-xs text-slate-400 dark:text-slate-500">
          {content.trim().length}/{MAX_LENGTH}
        </div>
      </div>
      {formError ? <p className="text-sm text-red-600 dark:text-red-400">{formError}</p> : null}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} className="inline-flex items-center gap-2">
          {submitting ? <Spinner size="sm" /> : null}
          <span>Publicar comentario</span>
        </Button>
        <Button
          type="button"
          color="light"
          onClick={() => {
            setAuthorName('');
            setContent('');
            setFormError(null);
          }}
          disabled={submitting || (!authorName && !content)}
        >
          Limpiar
        </Button>
      </div>
    </form>
  );
}

export default CommentForm;
