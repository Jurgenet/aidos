import { Router, type RequestHandler, type Router as RouterType } from 'express'
import multer from 'multer'
import { createReadStream } from 'node:fs'
import { fileService, FileNotFoundError, parseTagsString } from '@aid/me/file/server'
import { HttpError } from '@aid/me/shared/http-error'
import type { FileListFilter } from '@aid/me/file/types'
import { deleteFile, resolveFilePath, saveFile } from '../services/file-store.js'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Файлы: метаданные в Mongo (file collection), контент на диске в
 * FILE_STORE_DIR. Прямая ссылка `/api/files/:id` отдаёт с правильным
 * Content-Type — для картинок браузер сам рендерит превью.
 *
 * Без auth: single-user проект. Для multi-tenant — добавить middleware.
 * Без антивируса/clamav: загруженное не сканируется. Для прод —
 * прокинуть clamav-rest или аналог.
 *
 * multer в memoryStorage: файл целиком в RAM (limit FILE_MAX_SIZE),
 * для >50MB поменять на diskStorage с временным файлом.
 */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.FILE_MAX_SIZE },
})

const ID_RE = /^[a-f0-9]{24}$/i

const isValidId = (s: unknown): s is string => typeof s === 'string' && ID_RE.test(s)

/** Стрим файла клиенту — `inline` (браузер сам решает: показать картинку или скачать). */
const view: RequestHandler = async (req, res) => {
  try {
    const id = req.params['id']
    if (!isValidId(id)) {
      res.status(400).json({ error: { message: 'invalid id' } })
      return
    }
    const { meta, storedName } = await fileService.findStoredName(id)
    const filePath = resolveFilePath(storedName)
    res.setHeader('Content-Type', meta.mimeType)
    res.setHeader('Content-Length', String(meta.size))
    res.setHeader('Content-Disposition', `inline; filename="${encodeFilename(meta.originalName)}"`)
    const stream = createReadStream(filePath)
    stream.on('error', (e) => {
      logger.error({ err: e, id }, 'failed to stream file (view)')
      if (!res.headersSent) res.status(500).end()
      else res.destroy(e)
    })
    stream.pipe(res)
  } catch (e) {
    if (e instanceof FileNotFoundError) {
      res.status(404).json({ error: { message: 'file not found' } })
      return
    }
    throw e
  }
}

/** Скачать как attachment (с оригинальным именем). */
const download: RequestHandler = async (req, res) => {
  try {
    const id = req.params['id']
    if (!isValidId(id)) {
      res.status(400).json({ error: { message: 'invalid id' } })
      return
    }
    const { meta, storedName } = await fileService.findStoredName(id)
    const filePath = resolveFilePath(storedName)
    res.setHeader('Content-Type', meta.mimeType)
    res.setHeader('Content-Length', String(meta.size))
    res.setHeader('Content-Disposition', `attachment; filename="${encodeFilename(meta.originalName)}"`)
    const stream = createReadStream(filePath)
    stream.on('error', (e) => {
      logger.error({ err: e, id }, 'failed to stream file (download)')
      if (!res.headersSent) res.status(500).end()
      else res.destroy(e)
    })
    stream.pipe(res)
  } catch (e) {
    if (e instanceof FileNotFoundError) {
      res.status(404).json({ error: { message: 'file not found' } })
      return
    }
    throw e
  }
}

const list: RequestHandler = async (req, res, next) => {
  try {
    const q = req.query as Record<string, string | string[] | undefined>
    const filter: FileListFilter = {}
    // ?q=hello — case-insensitive substring по originalName
    if (typeof q.q === 'string' && q.q !== '') {
      filter.q = q.q
    }
    // ?tag=foo&tag=bar — можно несколько, AND-фильтр
    const tagsRaw: string[] = []
    for (const v of [q.tag, q['tag[]'], q.tags].flat()) {
      if (typeof v === 'string' && v !== '') tagsRaw.push(v)
      else if (Array.isArray(v)) {
        for (const t of v) {
          if (typeof t === 'string' && t !== '') tagsRaw.push(t)
        }
      }
    }
    if (tagsRaw.length > 0) {
      filter.tags = tagsRaw
    }
    const items = await fileService.list(filter)
    res.json({ items, total: items.length })
  } catch (e) {
    next(e)
  }
}

const uploadHandler: RequestHandler = (req, res, _next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(413).json({ error: { message: `file too large (max ${env.FILE_MAX_SIZE} bytes)` } })
          return
        }
        res.status(400).json({ error: { message: `multer: ${err.message}` } })
        return
      }
      res.status(500).json({ error: { message: err.message } })
      return
    }
    void handleUpload(req, res)
  })
}

async function handleUpload(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const file = (req as any).file as Express.Multer.File | undefined
  if (!file) {
    res.status(400).json({ error: { message: 'no file in form (field "file")' } })
    return
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (req as any).body as { tags?: unknown } | undefined
  const tags = parseTagsString(typeof body?.tags === 'string' ? body.tags : undefined)
  try {
    const saved = await saveFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    })
    const meta = await fileService.register(
      { originalname: file.originalname, mimetype: file.mimetype, size: file.size, buffer: file.buffer },
      saved.storedName,
      tags,
    )
    res.status(201).json(meta)
  } catch (e) {
    logger.error({ err: e }, 'upload failed')
    res.status(500).json({ error: { message: 'upload failed' } })
  }
}

const update: RequestHandler = async (req, res, next) => {
  const id = req.params['id']
  if (!isValidId(id)) {
    res.status(400).json({ error: { message: 'invalid id' } })
    return
  }
  const body = (req.body ?? {}) as { originalName?: unknown; tags?: unknown }
  if (body.originalName !== undefined && typeof body.originalName !== 'string') {
    res.status(400).json({ error: { message: 'originalName must be a string' } })
    return
  }
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || !body.tags.every((t) => typeof t === 'string')) {
      res.status(400).json({ error: { message: 'tags must be a string array' } })
      return
    }
  }
  try {
    const meta = await fileService.update(id, {
      originalName: typeof body.originalName === 'string' ? body.originalName : undefined,
      tags: Array.isArray(body.tags) ? (body.tags as string[]) : undefined,
    })
    res.json(meta)
  } catch (e) {
    if (e instanceof FileNotFoundError) {
      res.status(404).json({ error: { message: 'file not found' } })
      return
    }
    if (e instanceof HttpError) {
      res.status(e.status).json({ error: { message: e.message } })
      return
    }
    next(e)
  }
}

const remove: RequestHandler = async (req, res, next) => {
  const id = req.params['id']
  if (!isValidId(id)) {
    res.status(400).json({ error: { message: 'invalid id' } })
    return
  }
  try {
    const { storedName } = await fileService.delete(id)
    // Удаляем файл с диска. Если ошибка — логируем, но 200 всё равно:
    // DB-запись уже удалена, обратного пути нет.
    try {
      await deleteFile(storedName)
    } catch (e) {
      logger.error({ err: e, id, storedName }, 'file deleted from DB but not from disk')
    }
    res.status(204).end()
  } catch (e) {
    if (e instanceof FileNotFoundError) {
      res.status(404).json({ error: { message: 'file not found' } })
      return
    }
    next(e)
  }
}

/**
 * ASCII-safe вариант имени для Content-Disposition. Не-ASCII (русские
 * буквы и пр.) заменяет на `_` — клиенты (особенно старые браузеры)
 * по-разному интерпретируют RFC 5987, проще ограничиться ASCII.
 */
function encodeFilename(name: string): string {
  return name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
}

export function filesRouter(): RouterType {
  const r = Router()
  r.get('/files', list)
  // /files/:id идёт в /files/:id/download — порядок важен (Express матчит по порядку)
  r.get('/files/:id/download', download)
  r.get('/files/:id', view)
  r.post('/files', uploadHandler)
  r.patch('/files/:id', update)
  r.delete('/files/:id', remove)
  return r
}
