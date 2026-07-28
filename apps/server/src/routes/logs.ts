import { Router, type RequestHandler, type Router as RouterType } from 'express'
import { listLogs } from '@aid/me/log/server'
import { LOG_ACTIONS, LOG_ENTITIES, type LogAction, type LogEntity } from '@aid/me/log/types'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Чтение audit-логов. Записи создаются автоматически из entity-сервисов,
 * здесь только просмотр.
 *
 * Query:
 *   ?entity=user|account|note|device|order
 *   ?action=create|update|delete
 *   ?documentId=<id>      — лог конкретного документа
 *   ?limit=100            — 1..500, дефолт 100
 *
 * Без авторизации: проект на одного разработчика, auth ещё нет.
 * Когда появится — обернуть в middleware с проверкой роли.
 */
const VALID_ENTITIES = new Set<string>(LOG_ENTITIES)
const VALID_ACTIONS = new Set<string>(LOG_ACTIONS)

const list: RequestHandler = async (req, res, next) => {
  try {
    const q = req.query as Record<string, string | undefined>
    const filter: {
      entity?: LogEntity
      action?: LogAction
      documentId?: string
      limit?: number
    } = {}

    if (q.entity !== undefined) {
      if (!VALID_ENTITIES.has(q.entity)) {
        res.status(400).json({ error: { message: `invalid entity: ${q.entity}` } })
        return
      }
      filter.entity = q.entity as LogEntity
    }
    if (q.action !== undefined) {
      if (!VALID_ACTIONS.has(q.action)) {
        res.status(400).json({ error: { message: `invalid action: ${q.action}` } })
        return
      }
      filter.action = q.action as LogAction
    }
    if (q.documentId !== undefined) filter.documentId = q.documentId
    if (q.limit !== undefined) {
      const n = Number(q.limit)
      if (!Number.isFinite(n) || n < 1) {
        res.status(400).json({ error: { message: 'invalid limit' } })
        return
      }
      filter.limit = n
    }

    const items = await listLogs(filter)
    res.json({ items, total: items.length })
  } catch (e) {
    logger.error({ err: e, env: env.NODE_ENV }, 'listLogs failed')
    next(e)
  }
}

export function logsRouter(): RouterType {
  const r = Router()
  r.get('/logs', list)
  return r
}
