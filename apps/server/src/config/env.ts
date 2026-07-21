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
} as const

export type Env = typeof env
