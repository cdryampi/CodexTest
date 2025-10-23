import { toast } from 'sonner';
import i18n from '../i18n/index.js';

export const AUTH_TOAST_IDS = {
  unauthorized: 'auth:session-expired',
  forbidden: 'auth:forbidden-access'
};

const translate = (key, options) => {
  if (!i18n || typeof i18n.t !== 'function') {
    return key;
  }
  return i18n.t(key, options);
};

const buildToastOptions = (id) => ({
  id,
  duration: 4000
});

export const showUnauthorizedToast = () => {
  toast.error(translate('errors.unauthorized'), buildToastOptions(AUTH_TOAST_IDS.unauthorized));
};

export const showForbiddenToast = () => {
  toast.error(translate('errors.forbidden'), buildToastOptions(AUTH_TOAST_IDS.forbidden));
};

export const getRoleRequirementMessage = (roles) => {
  if (!roles || roles.length === 0) {
    return translate('rbac.roleRequired', { roles: '' });
  }
  const normalizedRoles = Array.isArray(roles) ? roles : [roles];
  const labels = normalizedRoles
    .map((role) => translate(`roles.${role}`, { defaultValue: role }))
    .filter(Boolean);
  const uniqueLabels = Array.from(new Set(labels));
  return translate('rbac.roleRequired', { roles: uniqueLabels.join(', ') });
};

export const getPermissionRequirementMessage = (permission) =>
  translate('rbac.missingPermission', { permission });

export const getLoadingPermissionsMessage = () => translate('rbac.loadingPermissions');
