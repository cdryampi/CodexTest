import { create } from 'zustand';
import { clearStoredTokens, getMe } from '../services/api.js';

const initialState = {
  user: null,
  roles: [],
  permissions: [],
  status: 'idle'
};

const toUniqueList = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  const unique = new Set();

  input.forEach((item) => {
    if (item == null) {
      return;
    }

    if (typeof item === 'string') {
      const value = item.trim();
      if (value) {
        unique.add(value);
      }
      return;
    }

    if (typeof item === 'object') {
      const candidate =
        item.code ??
        item.codename ??
        item.name ??
        item.slug ??
        item.label ??
        item.id;
      if (candidate != null) {
        const value = candidate.toString().trim();
        if (value) {
          unique.add(value);
        }
      }
    }
  });

  return Array.from(unique);
};

const emitLogoutEvent = () => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.dispatchEvent(new Event('auth:logout'));
  } catch (error) {
    // Ignoramos errores silenciosamente para entornos sin DOM.
  }
};

export const useAuthStore = create((set, get) => ({
  ...initialState,
  async fetchMe(options = {}) {
    const { force = false, ...requestOptions } = options ?? {};
    const currentStatus = get().status;

    if (!force) {
      if (currentStatus === 'loading') {
        return get().user;
      }
      if (currentStatus === 'ready') {
        return get().user;
      }
    }

    set({ status: 'loading' });

    try {
      const data = await getMe(requestOptions);
      const payload = data ?? null;
      const profile = payload && typeof payload === 'object' && payload.user ? payload.user : payload;

      const rolesSource =
        Array.isArray(payload?.roles) ? payload.roles : Array.isArray(profile?.roles) ? profile.roles : [];
      const permissionsSource =
        Array.isArray(payload?.permissions)
          ? payload.permissions
          : Array.isArray(profile?.permissions)
            ? profile.permissions
            : [];

      set({
        user: profile ?? null,
        roles: toUniqueList(rolesSource),
        permissions: toUniqueList(permissionsSource),
        status: 'ready'
      });

      return profile ?? null;
    } catch (error) {
      set({ ...initialState, status: 'error' });
      throw error;
    }
  },
  setUser(nextUser, meta = {}) {
    const resolvedUser = nextUser ?? null;
    const { roles: overrideRoles, permissions: overridePermissions, status } = meta ?? {};

    const rolesSource = Array.isArray(overrideRoles) ? overrideRoles : resolvedUser?.roles;
    const permissionsSource = Array.isArray(overridePermissions) ? overridePermissions : resolvedUser?.permissions;

    set({
      user: resolvedUser,
      roles: toUniqueList(rolesSource),
      permissions: toUniqueList(permissionsSource),
      status: status ?? (resolvedUser ? 'ready' : 'idle')
    });

    return resolvedUser;
  },
  logout() {
    clearStoredTokens();
    emitLogoutEvent();
    set({ ...initialState });
  }
}));

export default useAuthStore;
