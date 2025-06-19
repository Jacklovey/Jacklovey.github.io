// GitHub Pages 环境下的 Mock API 配置
import { setupWorker } from 'msw';
import { handlers } from './handlers';

// 仅在 GitHub Pages 或开发环境启用 MSW
const shouldEnableMock = () => {
  return process.env.VITE_ENABLE_MOCK === 'true' || 
         window.location.hostname.includes('github.io');
};

let worker;

if (shouldEnableMock()) {
  worker = setupWorker(...handlers);
  
  // 在 GitHub Pages 环境下启动
  worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js'
    }
  }).then(() => {
    console.log('🚀 Mock Service Worker 已启动 (GitHub Pages 模式)');
  }).catch(error => {
    console.warn('Mock Service Worker 启动失败:', error);
  });
}

export { worker };