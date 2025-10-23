import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDashboardLayout } from '../../layouts/DashboardLayout.jsx';
import PostForm from '../../components/backoffice/PostForm.jsx';

function DashboardPostEdit() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { setHeader } = useDashboardLayout();

  useEffect(() => {
    setHeader({
      title: t('dashboard.posts.editTitle'),
      description: t('dashboard.posts.editDescription'),
      showSearch: false,
      actions: null
    });
  }, [setHeader, t]);

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
