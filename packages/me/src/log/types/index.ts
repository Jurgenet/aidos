/**
 * Доменные типы audit-лога.
 *
 * Должны быть иммутабельны с клиента: на клиент попадают только для
 * отображения. Запись — только через server-сервис `recordLog`.
 */

export const LOG_ENTITIES = ['user', 'account', 'note', 'device', 'order'] as const
export type LogEntity = (typeof LOG_ENTITIES)[number]

export const LOG_ACTIONS = ['create', 'update', 'delete'] as const
export type LogAction = (typeof LOG_ACTIONS)[number]

export type Log = {
  id: string
  entity: LogEntity
  action: LogAction
  documentId: string
  userId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  timestamp: string
}
