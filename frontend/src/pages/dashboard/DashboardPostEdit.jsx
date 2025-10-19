import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import PostForm from '../../components/backoffice/PostForm.jsx';

function DashboardPostEdit() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { setHeader } = useDashboardLayout();

  useEffect(() => {
    setHeader({
      title: 'Editar post',
      description: 'Actualiza los datos del post y controla su publicación.',
      showSearch: false,
      actions: null
    });
  }, [setHeader]);

  useEffect(() => {
    if (!slug) {
      navigate('/dashboard/posts', { replace: true });
    }
  }, [navigate, slug]);

  if (!slug) {
    return null;
  }

  return (
    <PostForm
      mode="edit"
      slug={slug}
      onCancel={() => navigate('/dashboard/posts')}
      onSuccess={() => navigate('/dashboard/posts')}
    />
  );
}

export default DashboardPostEdit;
