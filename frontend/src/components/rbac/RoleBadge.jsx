import PropTypes from 'prop-types';
import { memo, useMemo } from 'react';
import { cn } from '../../lib/utils';

const ROLE_STYLES = {
  admin: 'bg-red-100 text-red-700 ring-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/40',
  editor: 'bg-amber-100 text-amber-700 ring-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/40',
  author: 'bg-emerald-100 text-emerald-700 ring-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/40',
  reviewer: 'bg-sky-100 text-sky-700 ring-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/40',
  reader: 'bg-slate-200 text-slate-700 ring-slate-500/30 dark:bg-slate-700/20 dark:text-slate-200 dark:ring-slate-500/30'
};

const ROLE_LABELS = {
  admin: 'Administrador',
  editor: 'Editor',
  author: 'Autor',
  reviewer: 'Revisor',
  reader: 'Lector'
};

const ROLE_PRIORITY = {
  admin: 1,
  editor: 2,
  author: 3,
  reviewer: 4,
  reader: 5
};

function normalizeRole(input) {
  if (!input) {
    return null;
  }
  if (typeof input !== 'string') {
    return `${input}`.trim();
  }
  return input.trim();
}

const RoleBadge = memo(function RoleBadge({ role, className }) {
  const normalized = useMemo(() => normalizeRole(role), [role]);

  if (!normalized) {
    return null;
  }

  const key = normalized.toLowerCase();
  const label = ROLE_LABELS[key] ?? normalized;
  const style = ROLE_STYLES[key] ?? 'bg-slate-200 text-slate-700 ring-slate-500/30 dark:bg-slate-700/20 dark:text-slate-200 dark:ring-slate-500/30';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset',
        style,
        className
      )}
      aria-label={`Rol: ${label}`}
      data-role-priority={ROLE_PRIORITY[key] ?? 99}
    >
      <span className="inline-block h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
});

RoleBadge.propTypes = {
  role: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string
};

RoleBadge.defaultProps = {
  role: '',
  className: undefined
};

export default RoleBadge;
