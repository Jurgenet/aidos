import { defineConfig } from '@playwright/test'

/**
 * E2E test config.
 *
 * Запускает полное dev-окружение (server + client) через `pnpm dev`,
 * ждёт готовности client'а на 4173, гоняет тесты.
 *
 * Требования к окружению для прогона:
 *   - MongoDB на mongodb://localhost:27017 (см. compose.yaml)
 *   - либо поднять весь compose, либо запустить `docker run -d -p 27017:27017 mongo:8`
 *
 * Если `pnpm dev` уже запущен в другом терминале, не убиваем его —
 * используем существующий сервер (`reuseExistingServer: !CI`).
 *
 * Версия @playwright/test зафиксирована на 1.39.0: начиная с 1.40
 * Playwright подтягивает @vitest/expect внутрь, что ломается при наличии
 * vitest в проекте (Cannot redefine property: $$jest-matchers-object).
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
