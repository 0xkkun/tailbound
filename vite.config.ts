import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, './src/components'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@test': path.resolve(__dirname, './src/test'),
      '@config': path.resolve(__dirname, './src/config'),
      '@services': path.resolve(__dirname, './src/services'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@type': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@game': path.resolve(__dirname, './src/game'),
      '@ui': path.resolve(__dirname, './src/ui'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@data': path.resolve(__dirname, './src/data'),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // PixiJS 코어를 별도 청크로 분리
          'pixi-core': ['pixi.js'],
          // Pixi React를 별도 청크로 분리
          'pixi-react': ['@pixi/react'],
          // React 관련 라이브러리를 별도 청크로 분리
          'react-vendor': ['react', 'react-dom', 'react-i18next', 'i18next'],
          // 애니메이션 라이브러리를 별도 청크로 분리
          animation: ['gsap'],
          // 오디오 라이브러리를 별도 청크로 분리
          audio: ['howler'],
          // 토스 SDK를 별도 청크로 분리
          'toss-sdk': ['@apps-in-toss/web-framework'],
        },
      },
    },
    // 청크 크기 경고 임계값 증가 (PixiJS는 크기가 큼)
    chunkSizeWarningLimit: 600,
    // 최소화 옵션
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 프로덕션에서 console 제거
        drop_debugger: true,
      },
    },
  },
});
