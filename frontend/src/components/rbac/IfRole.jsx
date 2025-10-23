import PropTypes from 'prop-types';
import { useMemo } from 'react';
import Can from './Can.jsx';

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

function IfRole({ roles, children, fallback }) {
  const normalizedRoles = useMemo(() => normalizeRoles(roles), [roles]);

  return (
    <Can roles={normalizedRoles} fallback={fallback}>
      {children}
    </Can>
  );
}

IfRole.propTypes = {
  roles: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    PropTypes.string,
    PropTypes.number
  ]),
  children: PropTypes.node,
  fallback: PropTypes.node
};

IfRole.defaultProps = {
  roles: undefined,
  children: null,
  fallback: null
};

export default IfRole;
