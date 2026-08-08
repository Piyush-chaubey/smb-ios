import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('swiper-') || tag.startsWith('ion-icon')
        }
      }
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  build: {
    // Target modern Android WebView (Chrome 87+) and evergreen browsers
    target: 'es2020',
    sourcemap: false
  },

  server: {
    port: 4200,
    proxy: {
      // Proxy audio files to bypass CORS in desktop dev
      '/spaces-proxy': {
        target: 'https://avd-bapuji.sfo2.digitaloceanspaces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/spaces-proxy/, '')
      }
    }
  }
})
