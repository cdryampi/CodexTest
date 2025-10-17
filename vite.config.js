import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const ensureBasePath = (value) => {
  if (!value || value === '/') {
    return '/';
  }

  let normalized = value;

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }

  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }

  return normalized;
};

export default defineConfig(({ mode }) => {
  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const basePathConfig = process.env.VITE_BASE_PATH ?? repository ?? 'react-tailwind-blog';
  const base = mode === 'production' ? ensureBasePath(basePathConfig) : '/';

  return {
    plugins: [react()],
    base
  };
});
