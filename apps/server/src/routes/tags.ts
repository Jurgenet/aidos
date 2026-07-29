import { Router, type RequestHandler, type Router as RouterType } from 'express'
import { listTags, renameTag, deleteTag } from '@aid/me/tag/server'
import { HttpError } from '@aid/me/shared/http-error'
import { logger } from '../config/logger.js'

/**
 * Глобальные операции над тегами.
 *
 * Теги — inline-строки в FileModel.tags, отдельной коллекции нет.
 * Эти эндпоинты — aggregate (list) и bulk-операции (rename/delete)
 * по всем файлам, у которых этот тег есть.
 */

const list: RequestHandler = async (_req, res, next) => {
  try {
    const items = await listTags()
    res.json({ items, total: items.length })
  } catch (e) {
    next(e)
  }
}

/** Декодирование имени тега из URL-параметра (может быть urlencoded). */
function decodeTagName(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

const rename: RequestHandler = async (req, res, next) => {
  const from = decodeTagName(typeof req.params['name'] === 'string' ? req.params['name'] : '')
  const body = (req.body ?? {}) as { newName?: unknown }
  if (typeof body.newName !== 'string') {
    res.status(400).json({ error: { message: 'newName must be a string' } })
    return
  }
  try {
    const result = await renameTag(from, body.newName)
    logger.info({ from: result.from, to: result.to, affected: result.affected }, 'tag renamed')
    res.json(result)
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).json({ error: { message: e.message } })
      return
    }
    next(e)
  }
}

const remove: RequestHandler = async (req, res, next) => {
  const name = decodeTagName(typeof req.params['name'] === 'string' ? req.params['name'] : '')
  try {
    const result = await deleteTag(name)
    logger.info({ name: result.name, affected: result.affected }, 'tag deleted')
    res.json(result)
  } catch (e) {
    if (e instanceof HttpError) {
      res.status(e.status).json({ error: { message: e.message } })
      return
    }
    next(e)
  }
}

export function tagsRouter(): RouterType {
  const r = Router()
  r.get('/tags', list)
  r.patch('/tags/:name/rename', rename)
  r.delete('/tags/:name', remove)
  return r
}
