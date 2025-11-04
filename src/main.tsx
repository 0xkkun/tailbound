import '@i18n/config';

import { createRoot } from 'react-dom/client';

import App from './App';

// 전역 에러 핸들러: Flutter로 전달되지 않도록 모든 에러를 잡아서 처리
window.addEventListener('error', (event) => {
  console.error('[Global Error Handler]', event.error);
  event.preventDefault(); // 기본 에러 처리 방지
  return false; // 에러 전파 방지
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Unhandled Rejection]', event.reason);
  event.preventDefault(); // 기본 에러 처리 방지
  return false; // 에러 전파 방지
});

createRoot(document.getElementById('pixi-container')!).render(<App />);
