import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { fileURLToPath, URL } from 'node:url'

/**
 * URL backend'а для dev-прокси `/api/*`.
 *
 * По умолчанию — `http://localhost:3000` (локальный запуск server'а).
 * В Docker (см. compose.yaml) переопределяется через `VITE_SERVER_URL=http://server:3000`
 * — там Vite работает в client-контейнере и должен форвардить запросы
 * в server-контейнер по compose-имени `server`, а не на localhost.
 */
const SERVER_URL = process.env.VITE_SERVER_URL ?? 'http://localhost:3000'

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    quasar({
      sassVariables: fileURLToPath(new URL('./src/css/quasar-variables.sass', import.meta.url)),
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    // За reverse-proxy (caddy в compose.yaml) Vite видит Host: localhost,
    // а при запросах напрямую — Host: client:4173. Без allowedHosts Vite 5+
    // режет такие запросы с 403 "Blocked request. This host is not allowed".
    allowedHosts: true,
    proxy: {
      '/api': {
        target: SERVER_URL,
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
  },
})
