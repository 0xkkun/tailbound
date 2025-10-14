import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

// https://vitest.dev/config/
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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    // Canvas mock requires single-threaded mode
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Optimize dependencies for PixiJS and React
    deps: {
      optimizer: {
        web: {
          include: ['vitest-canvas-mock', 'react-reconciler', '@pixi/react', 'pixi.js'],
        },
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.*',
        '**/*.d.ts',
        '**/main.tsx',
        '**/vite-env.d.ts',
      ],
    },
  },
});
