import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const repositoryBase = '/CodexTest/';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? repositoryBase : '/',
  root: __dirname,
  publicDir: resolve(__dirname, 'public'),
  server: {
    proxy: {
      '/api': {
        target: 'https://backendblog.yampi.eu',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: resolve(__dirname, '../dist'),
    emptyOutDir: true
  }
}));
