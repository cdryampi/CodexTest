import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import PostForm from '../../components/backoffice/PostForm.jsx';

function DashboardPostNew() {
  const { setHeader } = useDashboardLayout();
  const navigate = useNavigate();

  useEffect(() => {
    setHeader({
      title: 'Nuevo post',
      description: 'Completa los campos para crear una nueva publicación.',
      showSearch: false,
      actions: null
    });
  }, [setHeader]);

  return (
    <PostForm
      mode="create"
      onCancel={() => navigate('/dashboard/posts')}
      onSuccess={() => navigate('/dashboard/posts')}
    />
  );
}

export default DashboardPostNew;
