import { Router, type Router as RouterType } from 'express'
import { noteController } from './controller.js'

/**
 * Express Router для Note. Маунтится в apps/server под `app.use()`.
 *
 * Маршруты (абсолютные пути от корня apiRouter, см. apps/server/src/routes/index.ts):
 * - GET    /note        — список (опционально ?isPinned=true|false, ?tag=...)
 * - GET    /note/:id    — карточка по id
 * - POST   /note        — создание (тело валидируется zod)
 * - PATCH  /note/:id    — частичное обновление
 * - DELETE /note/:id    — удаление
 */
export function noteRouter(): RouterType {
  const r = Router()
  r.get('/note', noteController.list)
  r.get('/note/:id', noteController.getById)
  r.post('/note', noteController.create)
  r.patch('/note/:id', noteController.update)
  r.delete('/note/:id', noteController.delete)
  return r
}
