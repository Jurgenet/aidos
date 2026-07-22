// Корневой vitest config.
//
// Стратегия: один include-паттерн через всю монорепу, vitest сам разрулит
// проекты по пакетам. На MVP-этапе этого хватает — все тесты в node-окружении.
//
// Если понадобится разделение (например, jsdom для Vue-компонентов @aid/mq
// и node для всего остального) — перейдём на `test.workspace` с inline-проектами.

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['packages/**/src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
    environment: 'node',
  },
})
