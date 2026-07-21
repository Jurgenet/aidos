import pino from 'pino'
import { env } from './env.js'

/**
 * Pino-логгер. В dev — сырой JSON на stdout, без pino-pretty.
 *
 * Почему не pino-pretty в dev:
 * 1. Worker-thread'ы pino-pretty deadlock'атся, когда stdout прокинут через
 *    пайпы (concurrently / pnpm -r --parallel) — main-процесс зависает
 *    на первом logger-вызове.
 * 2. `sync: true` для in-process transport'а тоже проблема — теряет буферизацию.
 *
 * Если нужен человекочитаемый лог — используй `pnpm dev | pino-pretty`
 * снаружи, или подключай pino-pretty явно в конкретном скрипте.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
})
