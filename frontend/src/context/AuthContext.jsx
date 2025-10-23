import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { getStoredTokens, requestTokenRefresh, storeTokens } from '../services/api.js';
import useAuthStore from '../store/auth.js';

const AuthContext = createContext(null);

const TOKEN_EXPIRATION_BUFFER_MS = 15_000; // 15 segundos de margen

const isBrowser = typeof window !== 'undefined';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const decoded = jwtDecode(token);
    if (!decoded?.exp) {
      return true;
    }
    const expiration = decoded.exp * 1000;
    return expiration - TOKEN_EXPIRATION_BUFFER_MS <= Date.now();
  } catch (error) {
    return true;
  }
};

export function AuthProvider({ children }) {
  const [tokens, setTokens] = useState(() => getStoredTokens());
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncTokensFromStorage = useCallback(() => {
    setTokens(getStoredTokens());
  }, []);

  const applyLogoutState = useCallback(() => {
    setTokens({ access: null, refresh: null });
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    useAuthStore.getState().logout();
    applyLogoutState();
  }, [applyLogoutState]);

  const refreshTokens = useCallback(async () => {
    const currentTokens = getStoredTokens();
    if (!currentTokens.refresh) {
      await logout();
      return null;
    }

    try {
      const refreshed = await requestTokenRefresh(currentTokens.refresh);
      setTokens(getStoredTokens());
      return refreshed;
    } catch (error) {
      await logout();
      return null;
    }
  }, [logout]);

  const fetchCurrentUser = useCallback(async () => {
    const { fetchMe } = useAuthStore.getState();
    const profile = await fetchMe({ force: true });
    setUser(profile);
    return profile;
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      const response = await api.post('auth/login/', { email, password });
      const { access, refresh, user: profile } = response.data;
      storeTokens({ access, refresh });
      setTokens({ access, refresh });

      let currentUser = profile;
      if (!currentUser) {
        currentUser = await fetchCurrentUser();
      } else {
        setUser(currentUser);
        const { setUser: setStoreUser } = useAuthStore.getState();
        setStoreUser(currentUser, {
          roles: currentUser.roles,
          permissions: currentUser.permissions,
          status: 'ready'
        });
      }

      return currentUser;
    },
    [fetchCurrentUser]
  );

  const register = useCallback(async (payload) => {
    const response = await api.post('auth/registration/', payload);
    return response.data;
  }, []);

  const getCurrentUser = useCallback(async () => {
    if (!tokens.access) {
      return null;
    }
    if (isTokenExpired(tokens.access)) {
      const refreshed = await refreshTokens();
      if (!refreshed?.access) {
        return null;
      }
    }
    return fetchCurrentUser();
  }, [fetchCurrentUser, refreshTokens, tokens.access]);

  useEffect(() => {
    if (!isBrowser) return undefined;

    const handleTokens = () => syncTokensFromStorage();
    const handleLogoutEvent = () => applyLogoutState();

    window.addEventListener('auth:tokens', handleTokens);
    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('storage', handleTokens);

    return () => {
      window.removeEventListener('auth:tokens', handleTokens);
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('storage', handleTokens);
    };
  }, [applyLogoutState, syncTokensFromStorage]);

  useEffect(() => {
    const bootstrap = async () => {
      const currentTokens = getStoredTokens();
      if (!currentTokens.access && !currentTokens.refresh) {
        setIsLoading(false);
        return;
      }

      try {
        let accessToken = currentTokens.access;
        if (!accessToken || isTokenExpired(accessToken)) {
          const refreshed = await refreshTokens();
          accessToken = refreshed?.access ?? null;
        }

        if (!accessToken) {
          await logout();
          setIsLoading(false);
          return;
        }

        await fetchCurrentUser();
      } catch (error) {
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!tokens.access && !tokens.refresh) {
      setUser(null);
    }
  }, [tokens.access, tokens.refresh]);

  const isAuthenticated = useMemo(() => {
    if (!tokens.access) {
      return false;
    }
    return !isTokenExpired(tokens.access);
  }, [tokens.access]);

  const value = useMemo(
    () => ({
      user,
      tokens,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshTokens,
      getCurrentUser
    }),
    [getCurrentUser, isAuthenticated, isLoading, login, logout, refreshTokens, register, tokens, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
