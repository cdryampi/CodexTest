import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const repositoryBase = '/CodexTest/';
const DEFAULT_PROXY_TARGET = 'https://backendblog.yampi.eu';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resolveProxyTarget = (rawValue) => {
  if (typeof rawValue !== 'string') {
    return DEFAULT_PROXY_TARGET;
  }

  const trimmed = rawValue.trim();
  if (!trimmed) {
    return DEFAULT_PROXY_TARGET;
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return DEFAULT_PROXY_TARGET;
  }

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch (error) {
    console.warn('[vite] No fue posible resolver VITE_API_BASE_URL, usando proxy por defecto.', error);
    return DEFAULT_PROXY_TARGET;
  }
};

export default defineConfig(({ command, mode }) => {
  const envDir = __dirname;
  const env = loadEnv(mode, envDir, '');
  const proxyTarget = resolveProxyTarget(env.VITE_API_BASE_URL);
  const isSecureTarget = /^https:\/\//i.test(proxyTarget);

  return {
    plugins: [react()],
    base: command === 'build' ? repositoryBase : '/',
    root: __dirname,
    envDir,
    publicDir: resolve(__dirname, 'public'),
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: isSecureTarget
        }
      }
    },
    build: {
      outDir: resolve(__dirname, '../dist'),
      emptyOutDir: true
    }
  };
});
