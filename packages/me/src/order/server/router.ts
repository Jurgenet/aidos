import { Router, type Router as RouterType } from 'express'
import { orderController } from './controller.js'

/**
 * Express Router для Order. Маунтится в apps/server под `app.use()`.
 *
 * Маршруты:
 * - GET    /order       — список (опционально ?seller=...&vendor=...)
 * - GET    /order/:id   — карточка по id
 * - POST   /order       — создание
 * - PATCH  /order/:id   — частичное обновление
 * - DELETE /order/:id   — удаление
 */
export function orderRouter(): RouterType {
  const r = Router()
  r.get('/order', orderController.list)
  r.get('/order/:id', orderController.getById)
  r.post('/order', orderController.create)
  r.patch('/order/:id', orderController.update)
  r.delete('/order/:id', orderController.delete)
  return r
}