import { useCallback, useEffect, useMemo, useState, useId } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import DataTable from '../../components/backoffice/DataTable.jsx';
import ConfirmModal from '../../components/backoffice/ConfirmModal.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import {
  useDashboardStore,
  selectCommentsState
} from '../../store/dashboard.js';
import { listPosts, listComments, deleteComment } from '../../services/api.js';
import { Tooltip } from 'flowbite-react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import useAuthStore from '../../store/auth.js';
import { canModerateComments } from '../../utils/rbac.js';
import { getLoadingPermissionsMessage, getPermissionRequirementMessage, getRoleRequirementMessage } from '../../utils/notifications.js';

const truncate = (value, length = 80) => {
  if (!value) return '';
  if (value.length <= length) return value;
  return `${value.slice(0, length).trim()}…`;
};

function GuardedIconButton({ label, onClick, disabledReason, className }) {
  const tooltipId = useId();
  const button = (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      className={className}
      onClick={onClick}
      aria-label={label}
      disabled={Boolean(disabledReason)}
      tabIndex={disabledReason ? -1 : undefined}
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
    </Button>
  );

  if (!disabledReason) {
    return button;
  }

  return (
    <Tooltip content={<span id={tooltipId}>{disabledReason}</span>} trigger="hover" placement="top" style="dark">
      <span aria-describedby={tooltipId} className="inline-flex cursor-not-allowed">
        {button}
      </span>
    </Tooltip>
  );
}

function DashboardComments() {
  const { t, i18n } = useTranslation();
  const { setHeader } = useDashboardLayout();
  const commentsState = useDashboardStore(selectCommentsState);
  const setCommentsFilters = useDashboardStore((state) => state.setCommentsFilters);
  const resetComments = useDashboardStore((state) => state.resetComments);

  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteState, setDeleteState] = useState({ open: false, id: null, loading: false, preview: '' });

  const { status: authStatus, roles, permissions } = useAuthStore(
    (state) => ({
      status: state.status,
      roles: state.roles,
      permissions: state.permissions
    }),
    shallow
  );

  const authReady = authStatus === 'ready';
  const canModerate = authReady && canModerateComments({ roles, permissions });

  const loadingPermissionsMessage = useMemo(() => getLoadingPermissionsMessage(), [i18n.language]);
  const moderatorRequirement = useMemo(() => getRoleRequirementMessage(['editor', 'admin']), [i18n.language]);

  const deleteDisabledReason = useMemo(() => {
    if (!authReady) {
      return loadingPermissionsMessage;
    }
    if (canModerate) {
      return null;
    }
    return moderatorRequirement;
  }, [authReady, canModerate, loadingPermissionsMessage, moderatorRequirement]);

  const fetchPosts = useCallback(async () => {
    try {
      const response = await listPosts({ pageSize: 50, ordering: '-date' });
      const normalized = Array.isArray(response?.results) ? response.results : [];
      const unique = new Map();
      normalized.forEach((post) => {
        if (!post?.slug) return;
        if (!unique.has(post.slug)) {
          unique.set(post.slug, { slug: post.slug, title: post.title ?? post.slug });
        }
      });
      setPosts(Array.from(unique.values()));
    } catch (error) {
      toast.error('No pudimos cargar el listado de posts.');
    }
  }, []);

  const fetchComments = useCallback(async () => {
    if (!commentsState.postSlug) {
      setComments([]);
      setTotalCount(0);
      setPageCount(1);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await listComments(commentsState.postSlug, {
        page: commentsState.page,
        pageSize: commentsState.pageSize,
        ordering: commentsState.ordering
      });
      const results = Array.isArray(response?.results) ? response.results : [];
      const count = typeof response?.count === 'number' ? response.count : results.length;
      setComments(results);
      setTotalCount(count);
      setPageCount(Math.max(Math.ceil(count / commentsState.pageSize), 1));
    } catch (error) {
      toast.error('No pudimos cargar los comentarios.');
    } finally {
      setIsLoading(false);
    }
  }, [commentsState.ordering, commentsState.page, commentsState.pageSize, commentsState.postSlug]);

  useEffect(() => {
    setHeader({
      title: 'Comentarios',
      description: 'Modera la conversación y coordina respuestas con el equipo.',
      showSearch: false,
      actions: (
        <Button type="button" size="sm" onClick={fetchComments} disabled={!commentsState.postSlug}>
          Recargar
        </Button>
      )
    });
  }, [commentsState.postSlug, fetchComments, setHeader]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const filteredComments = useMemo(() => {
    const searchTerm = commentsState.search.trim().toLowerCase();
    if (!searchTerm) {
      return comments;
    }
    return comments.filter((comment) =>
      `${comment.author_name ?? ''} ${comment.content ?? ''}`.toLowerCase().includes(searchTerm)
    );
  }, [comments, commentsState.search]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'author_name',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Autor</span>,
        cell: ({ row }) => (
          <div className="max-w-[12rem]">
            <p className="font-medium text-slate-800 dark:text-slate-100">{row.original.author_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{row.original.email ?? 'Sin correo'}</p>
          </div>
        )
      },
      {
        accessorKey: 'content',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Comentario</span>,
        cell: ({ row }) => (
          <p className="max-w-xl text-sm text-slate-600 dark:text-slate-300">{truncate(row.original.content)}</p>
        )
      },
      {
        accessorKey: 'created_at',
        enableSorting: false,
        header: () => <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</span>,
        cell: ({ row }) => {
          const date = new Date(row.original.created_at);
          if (Number.isNaN(date.getTime())) {
            return <span className="text-xs text-slate-400">Sin fecha</span>;
          }
          return (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
                .format(date)
                .replace('.', '')}
            </span>
          );
        }
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Acciones</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <GuardedIconButton
              label={`Eliminar comentario de ${row.original.author_name ?? 'usuario'}`}
              onClick={() =>
                setDeleteState({
                  open: true,
                  id: row.original.id,
                  loading: false,
                  preview: truncate(row.original.content, 120)
                })
              }
              disabledReason={deleteDisabledReason}
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            />
          </div>
        )
      }
    ],
    [deleteDisabledReason, setDeleteState]
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteState.id) {
      return;
    }
    if (!authReady || !canModerate) {
      toast.error(getPermissionRequirementMessage(t('actions.moderate')));
      setDeleteState({ open: false, id: null, loading: false, preview: '' });
      return;
    }
    setDeleteState((prev) => ({ ...prev, loading: true }));
    try {
      await deleteComment(deleteState.id);
      toast.success('Comentario eliminado.');
      setDeleteState({ open: false, id: null, loading: false, preview: '' });
      fetchComments();
    } catch (error) {
      if (error?.status === 405) {
        toast.info('El backend aún no permite eliminar comentarios desde el panel.');
      } else {
        toast.error(error?.message ?? 'No se pudo eliminar el comentario.');
      }
      setDeleteState({ open: false, id: null, loading: false, preview: '' });
    }
  }, [authReady, canModerate, deleteState.id, fetchComments, t]);

  const pageIndex = commentsState.page - 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selecciona un post</span>
            <select
              value={commentsState.postSlug ?? ''}
              onChange={(event) =>
                setCommentsFilters({ postSlug: event.target.value, page: 1 })
              }
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">Selecciona un post para ver sus comentarios</option>
              {posts.map((post) => (
                <option key={post.slug} value={post.slug}>
                  {post.title}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Buscar</span>
            <Input
              type="search"
              value={commentsState.search}
              onChange={(event) => setCommentsFilters({ search: event.target.value, page: 1 })}
              placeholder="Filtra por autor o contenido"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ordenar</span>
            <select
              value={commentsState.ordering}
              onChange={(event) => setCommentsFilters({ ordering: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="-created_at">Más recientes</option>
              <option value="created_at">Más antiguos</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button type="button" variant="ghost" size="sm" onClick={resetComments}>
              Restablecer filtros
            </Button>
          </div>
        </div>
      </div>

      {commentsState.postSlug ? (
        <DataTable
          columns={columns}
          data={filteredComments}
          isLoading={isLoading}
          pageIndex={pageIndex}
          pageSize={commentsState.pageSize}
          pageCount={pageCount}
          onPageChange={(nextIndex) =>
            setCommentsFilters({ page: nextIndex + 1 })
          }
          renderToolbar={null}
          loadingMessage="Cargando comentarios..."
          emptyState={{
            title: 'Sin comentarios registrados',
            description: 'Cuando haya comentarios aparecerán aquí para su moderación.'
          }}
        />
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/80 p-6 text-center text-sm text-slate-500 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-400">
          Selecciona un post del listado para revisar sus comentarios.
        </div>
      )}

      <ConfirmModal
        open={deleteState.open}
        title="¿Eliminar comentario?"
        description={deleteState.preview ? `Se eliminará el comentario: "${deleteState.preview}"` : 'Esta acción eliminará el comentario del sistema.'}
        onCancel={() => setDeleteState({ open: false, id: null, loading: false, preview: '' })}
        onConfirm={confirmDelete}
        tone="danger"
        loading={deleteState.loading}
      />

      {commentsState.postSlug ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {filteredComments.length} comentario(s) mostrados de {totalCount} disponibles.
        </p>
      ) : null}
    </div>
  );
}

export default DashboardComments;
