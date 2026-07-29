import { Router, type RequestHandler, type Router as RouterType } from 'express'
import multer from 'multer'
import { createReadStream } from 'node:fs'
import { fileService, FileNotFoundError } from '@aid/me/file/server'
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

const list: RequestHandler = async (_req, res, next) => {
  try {
    const items = await fileService.list()
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
    )
    res.status(201).json(meta)
  } catch (e) {
    logger.error({ err: e }, 'upload failed')
    res.status(500).json({ error: { message: 'upload failed' } })
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
  r.delete('/files/:id', remove)
  return r
}
