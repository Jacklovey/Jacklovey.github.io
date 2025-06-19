import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// 启动应用 - 支持 GitHub Pages 环境
async function enableMocking() {
  // 检查是否为 GitHub Pages 环境或需要启用 Mock
  const isGitHubPages = window.location.hostname.includes('github.io');
  const shouldMock = import.meta.env.VITE_ENABLE_MOCK === 'true' || isGitHubPages;
  
  if (shouldMock) {
    console.log('🔧 GitHub Pages/Mock mode detected, starting MSW...')
    
    try {
      const { worker } = await import('./mocks/browser.js')
      
      return worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: import.meta.env.BASE_URL + 'mockServiceWorker.js'
        }
      }).then(() => {
        console.log('🔶 Mock Service Worker started successfully for GitHub Pages')
      })
    } catch (error) {
      console.error('❌ Failed to start Mock Service Worker:', error)
      // 在GitHub Pages上即使Mock失败也要继续运行
      return Promise.resolve()
    }
  }
  
  if (import.meta.env.DEV) {
    console.log('🌐 Development mode: Using real backend API at http://localhost:8001')
  } else {
    console.log('🌐 Production mode: API configured for deployment')
  }
  
  return Promise.resolve()
}

enableMocking().then(() => {
  console.log('🚀 Starting React application...')
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})