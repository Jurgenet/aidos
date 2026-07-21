import type { RequestHandler } from 'express'
import { userService } from './service.js'
import { createUserSchema, updateUserSchema } from '../types/index.js'
import type { UserRole } from '../types/index.js'

/**
 * Контроллер User. Каждый метод — Express RequestHandler.
 * Использует async/await: ошибки автоматически пробрасываются в
 * `errorHandler` middleware (через `next(err)` от Express 5).
 */
export const userController = {
  getById: (async (req, res) => {
    const user = await userService.findById(req.params.id as string)
    res.json(user)
  }) as RequestHandler,

  list: (async (req, res) => {
    const roleRaw = req.query.role
    const role = (typeof roleRaw === 'string' ? roleRaw : undefined) as UserRole | undefined
    const users = await userService.list({ role })
    res.json({ items: users, total: users.length })
  }) as RequestHandler,

  create: (async (req, res) => {
    const input = createUserSchema.parse(req.body)
    const user = await userService.create(input)
    res.status(201).json(user)
  }) as RequestHandler,

  update: (async (req, res) => {
    const input = updateUserSchema.parse(req.body)
    const user = await userService.update(req.params.id as string, input)
    res.json(user)
  }) as RequestHandler,

  delete: (async (req, res) => {
    await userService.delete(req.params.id as string)
    res.status(204).end()
  }) as RequestHandler,
}
