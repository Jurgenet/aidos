import { Schema, model } from 'mongoose'

/**
 * Audit log. Одна запись на каждую операцию create/update/delete
 * в любой из entity-коллекций (user, account, note, device, order).
 *
 * Поля:
 * - entity      — какая коллекция
 * - action      — какая операция
 * - documentId  — id затронутого документа (строкой)
 * - userId      — кто сделал (на текущий момент null, появится с auth)
 * - before      — состояние до операции (null для create)
 * - after       — состояние после (null для delete)
 * - timestamp   — время операции
 *
 * before/after — это плоские JSON-объекты, пригодные для просмотра
 * и diff-а. Не храним ссылки на Mongoose-документы.
 */
const logSchema = new Schema(
  {
    entity: { type: String, required: true, enum: ['user', 'account', 'note', 'device', 'order'] },
    action: { type: String, required: true, enum: ['create', 'update', 'delete'] },
    documentId: { type: String, required: true },
    userId: { type: String, default: null },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    timestamp: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
)

// Составной индекс под самый частый запрос — последние логи по документу.
logSchema.index({ entity: 1, documentId: 1, timestamp: -1 })
// Глобальный «последние N» (UI логов).
logSchema.index({ timestamp: -1 })

export const LogModel = model('Log', logSchema)
