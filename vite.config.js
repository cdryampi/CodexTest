import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryBase = '/CodexTest/';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? repositoryBase : '/'
}));
