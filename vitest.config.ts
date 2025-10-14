import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vitest.dev/config/
export default defineConfig({
  plugins: [react()],
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
