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
        buttons: fileURLToPath(new URL('./src/buttons/index.ts', import.meta.url)),
        forms: fileURLToPath(new URL('./src/forms/index.ts', import.meta.url)),
        tables: fileURLToPath(new URL('./src/tables/index.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}/index.js`,
    },
    rollupOptions: {
      external: ['vue', 'quasar'],
    },
  },
})
