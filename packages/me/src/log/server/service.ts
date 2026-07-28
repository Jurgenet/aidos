import { LogModel } from './model.js'
import type { Log, LogAction, LogEntity } from '../types/index.js'

/**
 * Записать одну запись в audit-лог. Вызывается из entity-сервисов
 * после успешной мутации.
 *
 * Защитное поведение: если запись не удалась (например, база в degraded
 * режиме), операция НЕ откатывается — мы не хотим, чтобы сбой
 * логирования ломал пользовательские CRUD-операции. Пишем в stderr
 * для отладки.
 *
 * userId — необязательный. Сейчас всегда null (auth нет), но параметр
 * оставлен чтобы в будущем просто прокинуть.
 */
export async function recordLog(args: {
  entity: LogEntity
  action: LogAction
  documentId: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  userId?: string | null
}): Promise<void> {
  try {
    await LogModel.create({
      entity: args.entity,
      action: args.action,
      documentId: args.documentId,
      userId: args.userId ?? null,
      before: args.before ?? null,
      after: args.after ?? null,
    })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[log] failed to record audit entry:', {
      err: e,
      entity: args.entity,
      action: args.action,
      documentId: args.documentId,
    })
  }
}

/**
 * Листинг логов с фильтрами и пагинацией.
 * Без авторизации (проект без auth) — отдаём всё подряд.
 */
export type LogListFilter = {
  entity?: LogEntity
  action?: LogAction
  documentId?: string
  limit?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLog(doc: any): Log {
  return {
    id: String(doc._id),
    entity: doc.entity,
    action: doc.action,
    documentId: doc.documentId,
    userId: doc.userId,
    before: doc.before,
    after: doc.after,
    timestamp: doc.timestamp instanceof Date ? doc.timestamp.toISOString() : String(doc.timestamp),
  }
}

export async function listLogs(filter: LogListFilter): Promise<Log[]> {
  const query: Record<string, unknown> = {}
  if (filter.entity !== undefined) query.entity = filter.entity
  if (filter.action !== undefined) query.action = filter.action
  if (filter.documentId !== undefined) query.documentId = filter.documentId
  const limit = Math.min(Math.max(filter.limit ?? 100, 1), 500)
  const docs = await LogModel.find(query).sort({ timestamp: -1 }).limit(limit).lean()
  return docs.map(toLog)
}
