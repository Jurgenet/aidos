import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

let loaded = false

/**
 * Загружает переменные из `./.env` (относительно cwd) в `process.env`.
 * - Выполняется не более одного раза.
 * - Не перезаписывает уже установленные переменные окружения.
 * - Без зависимостей. Используется, чтобы не тянуть dotenv и
 *   одинаково работать под `tsx` и собранным `node dist/...` запуском.
 */
export function loadEnv(): void {
  if (loaded) return
  loaded = true

  const envPath = resolve(process.cwd(), '.env')
  if (!existsSync(envPath)) return

  const content = readFileSync(envPath, 'utf-8')
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    if (!key) continue
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}
