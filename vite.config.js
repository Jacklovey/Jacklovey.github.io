import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // GitHub Pages 配置
  // 对于 username.github.io 仓库，始终使用 '/'
  const base = '/'

  return {
    plugins: [react()],
    
    base,
    
    // 构建配置
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            antd: ['antd-mobile']
          }
        }
      }
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    
    server: {
      port: 3000,
      open: true,
    },
    
    css: {
      preprocessorOptions: {
        less: {
          modifyVars: {
            '@primary-color': 'var(--color-primary)',
            '@font-family': 'var(--font-base)',
          },
          javascriptEnabled: true,
        }
      }
    }
  }
})