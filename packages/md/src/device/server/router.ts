import { Router, type Router as RouterType } from 'express'
import { deviceController } from './controller.js'

/**
 * Express Router для Device. Маунтится в apps/server под `app.use()`.
 *
 * Маршруты:
 * - GET    /device       — список (опционально ?tag=..., ?isBroken=true|false)
 * - GET    /device/:id   — карточка по id
 * - POST   /device       — создание
 * - PATCH  /device/:id   — частичное обновление
 * - DELETE /device/:id   — удаление
 */
export function deviceRouter(): RouterType {
  const r = Router()
  r.get('/device', deviceController.list)
  r.get('/device/:id', deviceController.getById)
  r.post('/device', deviceController.create)
  r.patch('/device/:id', deviceController.update)
  r.delete('/device/:id', deviceController.delete)
  return r
}
