import { Router, type Router as RouterType } from 'express'
import { userController } from './controller.js'

/**
 * Express Router для User. Маунтится в apps/server под `app.use()`.
 *
 * Маршруты (абсолютные пути от корня apiRouter, см. apps/server/src/routes/index.ts):
 * - GET    /user          — список (опционально ?role=admin|user|manager)
 * - GET    /user/:id      — карточка по id
 * - POST   /user          — создание (тело валидируется zod)
 * - PATCH  /user/:id      — частичное обновление
 * - DELETE /user/:id      — удаление
 */
export function userRouter(): RouterType {
  const r = Router()
  r.get('/user', userController.list)
  r.get('/user/:id', userController.getById)
  r.post('/user', userController.create)
  r.patch('/user/:id', userController.update)
  r.delete('/user/:id', userController.delete)
  return r
}
