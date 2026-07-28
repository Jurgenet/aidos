import { Router, type RequestHandler, type Router as RouterType } from 'express'
import { promises as fs, createReadStream } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Маршруты для UI бэкапов из клиента.
 *
 * Архитектура:
 * - Список/скачивание — читаем напрямую из bind-mount `.data/mongo-backups`.
 * - Статус/триггер бэкапа — прокси к mgob HTTP API.
 * - Восстановление — запускаем `mongorestore` локально из server-контейнера
 *   (mgob 2.0.28 падает на /restore: nil pointer в validate.go:90).
 */

const MGOB_TIMEOUT_MS = 30_000
const RESTORE_TIMEOUT_MS = 5 * 60_000

type BackupInfo = {
  filename: string
  size: number
  createdAt: string
}

function mgobBackupPath(): string {
  return `${env.MGOB_URL.replace(/\/$/, '')}/backup/${env.BACKUP_PLAN_ID}`
}

function mgobStatusPath(): string {
  return `${env.MGOB_URL.replace(/\/$/, '')}/status/${env.BACKUP_PLAN_ID}`
}

async function callMgob(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), MGOB_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

const isValidFilename = (name: string): boolean => /^[A-Za-z0-9._-]+\.gz$/.test(name)

/** Список архивов в каталоге плана. */
const list: RequestHandler = async (_req, res, next) => {
  try {
    const planDir = path.join(env.BACKUPS_DIR, env.BACKUP_PLAN_ID)
    const entries = await fs.readdir(planDir, { withFileTypes: true })
    const items: BackupInfo[] = []
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.gz')) continue
      const stat = await fs.stat(path.join(planDir, e.name))
      items.push({
        filename: e.name,
        size: stat.size,
        createdAt: stat.mtime.toISOString(),
      })
    }
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    res.json({ items })
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      res.json({ items: [] })
      return
    }
    next(e)
  }
}

/** Статус плана mgob (последний/следующий запуск, last_run_status). */
const status: RequestHandler = async (_req, res) => {
  try {
    const r = await callMgob(mgobStatusPath())
    if (!r.ok) {
      res.status(502).json({ error: { message: `mgob returned ${r.status}` } })
      return
    }
    const data = (await r.json()) as Record<string, unknown>
    res.json(data)
  } catch (e) {
    logger.error({ err: e }, 'mgob status failed')
    res.status(502).json({ error: { message: 'mgob unavailable' } })
  }
}

/** Запустить on-demand бэкап. Проксирует к mgob. */
const trigger: RequestHandler = async (_req, res) => {
  try {
    const r = await callMgob(mgobBackupPath(), { method: 'POST' })
    if (!r.ok) {
      const text = await r.text()
      res.status(502).json({ error: { message: `mgob backup failed: ${r.status} ${text}` } })
      return
    }
    const data = (await r.json()) as Record<string, unknown>
    res.status(201).json(data)
  } catch (e) {
    logger.error({ err: e }, 'mgob trigger failed')
    res.status(502).json({ error: { message: 'mgob unavailable' } })
  }
}

/** Скачать архив — стримим напрямую из bind-mount. */
const download: RequestHandler = async (req, res, next) => {
  const filename = req.params['filename']
  if (typeof filename !== 'string' || !isValidFilename(filename)) {
    res.status(400).json({ error: { message: 'invalid filename' } })
    return
  }
  const filePath = path.join(env.BACKUPS_DIR, env.BACKUP_PLAN_ID, filename)
  try {
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) {
      res.status(404).json({ error: { message: 'not found' } })
      return
    }
    res.setHeader('Content-Type', 'application/gzip')
    res.setHeader('Content-Length', String(stat.size))
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    createReadStream(filePath).pipe(res)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ error: { message: 'backup not found' } })
      return
    }
    next(e)
  }
}

/**
 * Восстановить из архива. Шеллим `mongorestore` (mgob 2.0.28 на /restore
 * падает с nil pointer — см. комментарий в шапке файла). --drop
 * пересоздаёт коллекции, существующие документы в них будут потеряны.
 */
const restore: RequestHandler = async (req, res) => {
  const filename = req.params['filename']
  if (typeof filename !== 'string' || !isValidFilename(filename)) {
    res.status(400).json({ error: { message: 'invalid filename' } })
    return
  }
  const filePath = path.join(env.BACKUPS_DIR, env.BACKUP_PLAN_ID, filename)
  try {
    await fs.access(filePath)
  } catch {
    res.status(404).json({ error: { message: 'backup not found' } })
    return
  }
  const startedAt = Date.now()
  const args = [
    '--gzip',
    '--archive=' + filePath,
    '--drop',
    '--uri=' + env.MONGO_URI,
    '--nsFrom=' + env.MONGO_DB_NAME + '.*',
    '--nsTo=' + env.MONGO_DB_NAME + '.*',
  ]
  logger.info({ args, file: filename }, 'mongorestore started')
  const child = spawn('mongorestore', args, { stdio: ['ignore', 'pipe', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', (b: Buffer) => {
    stderr += b.toString()
  })
  const timer = setTimeout(() => {
    child.kill('SIGKILL')
    logger.error({ file: filename }, 'mongorestore timeout, killed')
  }, RESTORE_TIMEOUT_MS)
  child.on('error', (e) => {
    clearTimeout(timer)
    logger.error({ err: e, file: filename }, 'mongorestore spawn failed')
    res.status(500).json({ error: { message: `mongorestore failed: ${e.message}` } })
  })
  child.on('close', (code) => {
    clearTimeout(timer)
    const durationMs = Date.now() - startedAt
    if (code === 0) {
      logger.info({ file: filename, durationMs }, 'mongorestore ok')
      res.json({ ok: true, file: filename, durationMs })
      return
    }
    logger.error({ code, stderr, file: filename, durationMs }, 'mongorestore failed')
    res.status(500).json({
      error: {
        message: `mongorestore exited with code ${code}`,
        details: { stderr: stderr.slice(-2000) },
      },
    })
  })
}

export function backupsRouter(): RouterType {
  const r = Router()
  r.get('/backups', list)
  r.get('/backups/status', status)
  r.post('/backups', trigger)
  r.get('/backups/:filename/download', download)
  r.post('/backups/:filename/restore', restore)
  return r
}
