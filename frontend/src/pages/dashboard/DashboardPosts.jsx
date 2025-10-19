import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { RefreshCcw, Plus } from 'lucide-react';
import DataTable from '../../components/backoffice/DataTable.jsx';
import ConfirmModal from '../../components/backoffice/ConfirmModal.jsx';
import { Button } from '../../components/ui/button.jsx';
import { getPosts, deletePost } from '../../services/api.js';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';

function DashboardPosts() {
  const { setHeader } = useDashboardLayout();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmState, setConfirmState] = useState({ open: false, post: null, isDeleting: false });

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getPosts();
      setPosts(response.results ?? []);
    } catch (error) {
      console.error('No fue posible obtener los posts del dashboard.', error);
      toast.error('No pudimos cargar los posts, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = useCallback(() => {
    toast.info('Actualizando listado de posts...');
    fetchPosts();
  }, [fetchPosts]);

  const handleCreate = useCallback(() => {
    toast.info('La creación de posts llegará cuando se conecte el backend.');
  }, []);

  useEffect(() => {
    setHeader({
      title: 'Posts',
      description: 'Gestiona el estado de las publicaciones y revisa su actividad.',
      showSearch: true,
      actions: (
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={handleCreate}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo post
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Refrescar
          </Button>
        </div>
      )
    });
  }, [handleCreate, handleRefresh, setHeader]);

  const handleView = useCallback((post) => {
    toast.info(`Vista previa de "${post.title}" disponible próximamente.`);
  }, []);

  const handleEdit = useCallback((post) => {
    toast.info(`La edición de "${post.title}" se habilitará cuando conectemos el CMS.`);
  }, []);

  const handleDelete = useCallback((post) => {
    setConfirmState({ open: true, post, isDeleting: false });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!confirmState.post) {
      return;
    }
    setConfirmState((state) => ({ ...state, isDeleting: true }));
    try {
      await deletePost(confirmState.post.id);
      setPosts((current) => current.filter((item) => item.id !== confirmState.post.id));
      toast.success(`Post "${confirmState.post.title}" eliminado.`);
    } catch (error) {
      console.error('No se pudo eliminar el post.', error);
      toast.error('No se pudo eliminar el post, intenta de nuevo.');
    } finally {
      setConfirmState({ open: false, post: null, isDeleting: false });
    }
  }, [confirmState.post]);

  const modalDescription = useMemo(() => {
    if (!confirmState.post) {
      return null;
    }
    return `Se eliminará "${confirmState.post.title}" del backoffice actual. Cuando el backend esté disponible se enviará la petición definitiva.`;
  }, [confirmState.post]);

  return (
    <div className="space-y-8">
      <DataTable data={posts} isLoading={isLoading} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />
      <ConfirmModal
        open={confirmState.open}
        title="¿Deseas eliminar este post?"
        description={modalDescription}
        confirmLabel="Eliminar post"
        cancelLabel="Cancelar"
        onCancel={() => setConfirmState({ open: false, post: null, isDeleting: false })}
        onConfirm={confirmDelete}
        tone="danger"
        loading={confirmState.isDeleting}
      />
    </div>
  );
}

export default DashboardPosts;
