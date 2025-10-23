import { isValidElement, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { shallow } from 'zustand/shallow';
import { useAuth } from '../../context/AuthContext.jsx';
import useAuthStore from '../../store/auth.js';
import RbacSkeleton from '../skeleton/RbacSkeleton.jsx';

const DEFAULT_FALLBACK_ROUTE = '/forbidden';

const normalizeRoles = (input) => {
  if (!input) {
    return [];
  }

  const list = Array.isArray(input) ? input : [input];

  return list
    .map((value) => {
      if (value == null) {
        return null;
      }
      const stringValue = typeof value === 'string' ? value : `${value}`;
      return stringValue.trim().toLowerCase();
    })
    .filter(Boolean);
};

const normalizeGrantedRoles = (roles) => {
  if (!Array.isArray(roles)) {
    return [];
  }
  return roles
    .map((value) => {
      if (value == null) {
        return null;
      }
      const stringValue = typeof value === 'string' ? value : `${value}`;
      return stringValue.trim().toLowerCase();
    })
    .filter(Boolean);
};

const renderFallbackElement = (fallback, location) => {
  const target = fallback ?? DEFAULT_FALLBACK_ROUTE;

  if (typeof target === 'string') {
    if (location.pathname === target) {
      return null;
    }
    return <Navigate to={target} replace state={{ from: location.pathname }} />;
  }

  if (typeof target === 'function') {
    const Component = target;
    return <Component />;
  }

  if (isValidElement(target)) {
    return target;
  }

  if (!location.pathname || location.pathname === DEFAULT_FALLBACK_ROUTE) {
    return null;
  }

  return <Navigate to={DEFAULT_FALLBACK_ROUTE} replace state={{ from: location.pathname }} />;
};

function ProtectedRoute({ children, allowedRoles, fallback }) {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { status, roles, fetchMe } = useAuthStore(
    (state) => ({
      status: state.status,
      roles: state.roles,
      fetchMe: state.fetchMe
    }),
    shallow
  );

  const [fetchError, setFetchError] = useState(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      requestedRef.current = false;
      setFetchError(null);
      return;
    }

    if ((status === 'idle' || status === 'error') && !requestedRef.current) {
      requestedRef.current = true;
      fetchMe()
        .then(() => {
          setFetchError(null);
        })
        .catch((error) => {
          setFetchError(error);
        });
    }
  }, [fetchMe, isAuthenticated, status]);

  const normalizedAllowedRoles = useMemo(() => normalizeRoles(allowedRoles), [allowedRoles]);
  const normalizedUserRoles = useMemo(() => normalizeGrantedRoles(roles), [roles]);

  const isLoading = authLoading || status === 'idle' || status === 'loading';

  if (!isAuthenticated && !authLoading) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isLoading) {
    return <RbacSkeleton />;
  }

  if (status === 'error' || fetchError) {
    return renderFallbackElement(fallback, location);
  }

  if (normalizedAllowedRoles.length > 0) {
    const hasAccess = normalizedAllowedRoles.some((role) => normalizedUserRoles.includes(role));

    if (!hasAccess) {
      return renderFallbackElement(fallback, location);
    }
  }

  return <>{children}</>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node,
  allowedRoles: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    PropTypes.string,
    PropTypes.number
  ]),
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func, PropTypes.string])
};

ProtectedRoute.defaultProps = {
  children: null,
  allowedRoles: undefined,
  fallback: DEFAULT_FALLBACK_ROUTE
};

export default ProtectedRoute;
