import { useEffect, useMemo, useState } from 'react';
import { ChatBubbleLeftRightIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import CommentForm from './CommentForm';
import Skeleton from './common/Skeleton';
import Toast from './Toast';

const formatDate = (value) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const normalizeNestedComments = (comments) => {
  if (!Array.isArray(comments)) {
    return [];
  }

  const hasChildrenProp = comments.some((comment) => Array.isArray(comment.children) || Array.isArray(comment.replies));

  if (hasChildrenProp) {
    const mapChildren = (items) =>
      items.map((item) => ({
        ...item,
        children: mapChildren(item.children || item.replies || [])
      }));
    return mapChildren(comments);
  }

  const byId = new Map();
  comments.forEach((comment) => {
    byId.set(comment.id, { ...comment, children: [] });
  });

  const roots = [];

  byId.forEach((comment) => {
    const parentId = comment.parent ?? comment.parent_id ?? comment.parentId;
    if (parentId && byId.has(parentId)) {
      byId.get(parentId).children.push(comment);
    } else {
      roots.push(comment);
    }
  });

  const sortRecursively = (items) =>
    items
      .map((item) => ({
        ...item,
        children: sortRecursively(item.children)
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return sortRecursively(roots);
};

function CommentItem({ comment, depth = 0 }) {
  const author = comment.author_name || comment.author || 'Anónimo';
  const rawDate = comment.created_at || comment.createdAt || comment.timestamp;
  const createdAt = formatDate(rawDate);

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900/60 ${depth > 0 ? 'ml-4 sm:ml-8' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="font-semibold text-slate-700 dark:text-slate-200">{author}</span>
        <time dateTime={rawDate || undefined}>{createdAt}</time>
      </div>
      <p className="mt-3 whitespace-pre-line text-slate-700 dark:text-slate-300">{comment.content}</p>
      {Array.isArray(comment.children) && comment.children.length > 0 ? (
        <div className="mt-4 space-y-4">
          {comment.children.map((child, index) => (
            <CommentItem key={child.id || `${comment.id}-child-${index}`} comment={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CommentsSection({ slug, comments, loading, error, onRetry, onRefresh }) {
  const [toastState, setToastState] = useState({ type: 'success', message: '' });

  const structuredComments = useMemo(() => normalizeNestedComments(comments), [comments]);

  const showToast = (type, message) => {
    setToastState({ type, message });
  };

  useEffect(() => {
    if (!toastState.message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setToastState((current) => ({ ...current, message: '' }));
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [toastState.message]);

  const handleSuccess = () => {
    showToast('success', 'Comentario publicado con éxito.');
    onRefresh?.();
  };

  const handleError = (err) => {
    showToast('error', err?.message || 'No se pudo publicar el comentario.');
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <ChatBubbleLeftRightIcon className="h-6 w-6 text-sky-600 dark:text-sky-300" aria-hidden="true" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Comentarios</h2>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} />
          ))}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">No se pudieron cargar los comentarios.</p>
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-red-900"
            >
              <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </button>
          </div>
        </div>
      ) : null}
      {!loading && !error && structuredComments.length === 0 ? (
        <p className="text-slate-600 dark:text-slate-400">Aún no hay comentarios. ¡Sé la primera persona en compartir tus ideas!</p>
      ) : null}
      <div className="space-y-4">
        {structuredComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Deja tu comentario</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Tu correo electrónico no se publicará. Los campos obligatorios están marcados.
        </p>
        <div className="mt-4">
          <CommentForm slug={slug} onSuccess={handleSuccess} onError={handleError} />
        </div>
      </div>
      <Toast
        type={toastState.type}
        message={toastState.message}
        onClose={() => setToastState({ type: 'success', message: '' })}
      />
    </section>
  );
}

export default CommentsSection;
