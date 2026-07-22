import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    lib: {
      entry: {
        'http-error': fileURLToPath(new URL('./src/http-error/index.ts', import.meta.url)),
        'user/types': fileURLToPath(new URL('./src/user/types/index.ts', import.meta.url)),
        'user/server': fileURLToPath(new URL('./src/user/server/index.ts', import.meta.url)),
        'user/client': fileURLToPath(new URL('./src/user/client/index.ts', import.meta.url)),
        'account/types': fileURLToPath(new URL('./src/account/types/index.ts', import.meta.url)),
        'account/server': fileURLToPath(new URL('./src/account/server/index.ts', import.meta.url)),
        'account/client': fileURLToPath(new URL('./src/account/client/index.ts', import.meta.url)),
        'note/types': fileURLToPath(new URL('./src/note/types/index.ts', import.meta.url)),
        'note/server': fileURLToPath(new URL('./src/note/server/index.ts', import.meta.url)),
        'note/client': fileURLToPath(new URL('./src/note/client/index.ts', import.meta.url)),
        'device/types': fileURLToPath(new URL('./src/device/types/index.ts', import.meta.url)),
        'device/server': fileURLToPath(new URL('./src/device/server/index.ts', import.meta.url)),
        'device/client': fileURLToPath(new URL('./src/device/client/index.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}/index.js`,
    },
    rollupOptions: {
      external: ['vue', 'pinia', 'mongoose', 'express', 'zod', '@aid/mq/forms', '@aid/mq/buttons', '@aid/mq/tables'],
    },
  },
})
