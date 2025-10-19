import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import { useAuth } from '../context/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
        <Spinner size="lg" />
        <span>Cargando sesión...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired
};

export default ProtectedRoute;
