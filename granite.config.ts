import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'tailbound',
  brand: {
    displayName: '설화',
    primaryColor: '#E39F54',
    icon: 'https://tailbound.vercel.app/favicon.png',
    bridgeColorMode: 'inverted',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  webViewProps: {
    type: 'game',
  },
  permissions: [],
  outdir: 'dist',
});
