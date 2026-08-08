import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vitest/config'

import vue from '@vitejs/plugin-vue'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Treat Ionic/Swiper custom elements as known (same as vite.config.ts)
          isCustomElement: (tag) => tag.startsWith('swiper-') || tag.startsWith('ion-icon')
        }
      }
    })
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  test: {
    // Use jsdom to simulate browser environment for Vue + Capacitor
    environment: 'jsdom',
    // Load global mocks before every test file
    setupFiles: ['./src/tests/setup.ts'],
    // Make describe/it/expect/vi available globally (no need to import)
    globals: true,
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/tests/**', 'src/vite-env.d.ts', 'src/shims-swiper.d.ts'],
      thresholds: {
        statements: 30,
        branches: 30,
        functions: 30,
        lines: 30
      }
    }
  }
})
