import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import useAuthStore from '../../store/auth.js';

const normalizeList = (value) => {
  if (!value) {
    return [];
  }
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => {
      if (item == null) {
        return null;
      }
      const stringValue = typeof item === 'string' ? item : `${item}`;
      return stringValue.trim().toLowerCase();
    })
    .filter(Boolean);
};

function Can({ roles, role, permission, permissions, children, fallback }) {
  const { status, userRoles, userPermissions } = useAuthStore(
    (state) => ({
      status: state.status,
      userRoles: state.roles,
      userPermissions: state.permissions
    }),
    shallow
  );

  const normalizedRoles = useMemo(() => {
    const combinedRoles = normalizeList(roles);
    const singleRole = normalizeList(role);
    return [...combinedRoles, ...singleRole];
  }, [role, roles]);

  const normalizedPermissions = useMemo(() => {
    const combinedPermissions = normalizeList(permissions);
    const singlePermission = normalizeList(permission);
    return [...combinedPermissions, ...singlePermission];
  }, [permission, permissions]);

  const hasRoleRequirement = normalizedRoles.length > 0;
  const hasPermissionRequirement = normalizedPermissions.length > 0;

  if (status === 'idle' || status === 'loading') {
    return null;
  }

  if (status === 'error') {
    return fallback ?? null;
  }

  if (!hasRoleRequirement && !hasPermissionRequirement) {
    return <>{children}</>;
  }

  const grantedRoles = Array.isArray(userRoles)
    ? userRoles.map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : `${item}`.trim().toLowerCase()))
    : [];

  if (hasRoleRequirement) {
    const matchesRole = normalizedRoles.some((requiredRole) => grantedRoles.includes(requiredRole));
    if (!matchesRole) {
      return fallback ?? null;
    }
  }

  if (!hasPermissionRequirement) {
    return <>{children}</>;
  }

  const grantedPermissions = Array.isArray(userPermissions)
    ? userPermissions.map((item) => (typeof item === 'string' ? item.trim().toLowerCase() : `${item}`.trim().toLowerCase()))
    : [];

  const matchesPermission = normalizedPermissions.some((requiredPermission) =>
    grantedPermissions.includes(requiredPermission)
  );

  if (!matchesPermission) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

Can.propTypes = {
  roles: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])), PropTypes.string, PropTypes.number]),
  role: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  permission: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  permissions: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    PropTypes.string,
    PropTypes.number
  ]),
  children: PropTypes.node,
  fallback: PropTypes.node
};

Can.defaultProps = {
  roles: undefined,
  role: undefined,
  permission: undefined,
  permissions: undefined,
  children: null,
  fallback: null
};

export default Can;
