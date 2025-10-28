import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@test': path.resolve(__dirname, './src/test'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
  },
  build: {
    outDir: 'dist',
  },
});
