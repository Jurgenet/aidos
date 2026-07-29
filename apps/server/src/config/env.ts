import process from 'node:process'
import { loadEnv } from './load-env.js'

loadEnv()

type NodeEnv = 'development' | 'production' | 'test'
const NODE_ENV_VALUES: readonly NodeEnv[] = ['development', 'production', 'test'] as const

function readString(key: string, fallback: string): string {
  const value = process.env[key]
  return value !== undefined && value !== '' ? value : fallback
}

function readNumber(key: string, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const raw = process.env[key]
  if (raw === undefined || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`Invalid number in env var ${key}: ${raw}`)
  }
  return n
}

function readPort(key: string, fallback: number): number {
  return readNumber(key, fallback, 0, 65535)
}

function readNodeEnv(): NodeEnv {
  const raw = (process.env['NODE_ENV'] ?? 'development').toLowerCase()
  return (NODE_ENV_VALUES as readonly string[]).includes(raw) ? (raw as NodeEnv) : 'development'
}

export const env = {
  NODE_ENV: readNodeEnv(),
  LOG_LEVEL: readString('LOG_LEVEL', 'info'),
  HOST: readString('HOST', '0.0.0.0'),
  PORT: readPort('PORT', 3000),
  MONGO_URI: readString('MONGO_URI', 'mongodb://localhost:27017/aid'),
  MONGO_DB_NAME: readString('MONGO_DB_NAME', 'aid'),
  SHUTDOWN_TIMEOUT_MS: readNumber('SHUTDOWN_TIMEOUT_MS', 10_000, 100, 5 * 60_000),
  // URL mgob (агент бэкапов Mongo). В compose — http://mgob:8090,
  // локально без compose — http://localhost:8090.
  MGOB_URL: readString('MGOB_URL', 'http://localhost:8090'),
  // Каталог с архивами бэкапов (bind-mount на .data/mongo-backups).
  // Только для чтения — restore делает сам mgob через свой mount.
  BACKUPS_DIR: readString('BACKUPS_DIR', '.data/mongo-backups'),
  // ID плана в mgob. Соответствует имени файла infra/mgob/config/<PLAN>.yaml.
  BACKUP_PLAN_ID: readString('BACKUP_PLAN_ID', 'aid'),
  // Telegram-нотификатор: шлёт в бот новые записи из коллекции logs.
  // Если TELEGRAM_BOT_TOKEN пустой — нотификатор выключен, остальные
  // TELEGRAM_* игнорируются. См. docs/TELEGRAM.md для настройки.
  TELEGRAM_BOT_TOKEN: readString('TELEGRAM_BOT_TOKEN', ''),
  // Фиксированный chat_id (если задан — /start перезаписывать нельзя).
  // Если пустой — /start от любого юзера перехватывает chat_id,
  // последующие /start перезатирают (один подписчик).
  TELEGRAM_CHAT_ID: readString('TELEGRAM_CHAT_ID', ''),
  // Стартовое состояние «включён/выключен». Переключается рантайм
  // командами /on /off и сохраняется в .data/telegram-state.json.
  TELEGRAM_ENABLED: readString('TELEGRAM_ENABLED', 'true') === 'true',
  // Интервал поллинга logs-коллекции (мс). Long-poll getUpdates
  // для команд работает отдельно (timeout=20s в getUpdates).
  TELEGRAM_POLL_INTERVAL_MS: readNumber('TELEGRAM_POLL_INTERVAL_MS', 5_000, 500, 5 * 60_000),
  // Каталог для runtime-стейта нотификатора (chat_id, enabled). В compose
  // маунтится read-write (BACKUPS_DIR маунтится read-only отдельно).
  TELEGRAM_STATE_DIR: readString('TELEGRAM_STATE_DIR', '.data'),
  // Каталог для загруженных файлов. В compose — /files (bind-mount на
  // /.data/file_store), в локальном dev — .data/file_store относительно
  // cwd. Пользователь может поменять source в compose.yaml, чтобы
  // хранить файлы на отдельном диске.
  FILE_STORE_DIR: readString('FILE_STORE_DIR', '.data/file_store'),
  // Максимальный размер одного файла (байт). Защита от заливки огромных
  // файлов в dev. По умолчанию 50 MB.
  FILE_MAX_SIZE: readNumber('FILE_MAX_SIZE', 50 * 1024 * 1024, 1, 5 * 1024 * 1024 * 1024),
} as const

export type Env = typeof env
