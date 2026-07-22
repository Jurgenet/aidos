import { Router, type Router as RouterType } from 'express'
import { accountController } from './controller.js'

/**
 * Express Router для Account. Маунтится в apps/server под `app.use()`.
 *
 * Маршруты (абсолютные пути от корня apiRouter, см. apps/server/src/routes/index.ts):
 * - GET    /account       — список (опционально ?group=...)
 * - GET    /account/:id   — карточка по id
 * - POST   /account       — создание (тело валидируется zod)
 * - PATCH  /account/:id   — частичное обновление
 * - DELETE /account/:id   — удаление
 */
export function accountRouter(): RouterType {
  const r = Router()
  r.get('/account', accountController.list)
  r.get('/account/:id', accountController.getById)
  r.post('/account', accountController.create)
  r.patch('/account/:id', accountController.update)
  r.delete('/account/:id', accountController.delete)
  return r
}
