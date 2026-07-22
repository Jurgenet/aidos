import type { RequestHandler } from 'express'
import { accountService } from './service.js'
import { createAccountSchema, updateAccountSchema } from '../types/index.js'

/**
 * Контроллер Account. Каждый метод — Express RequestHandler.
 * Использует async/await: ошибки автоматически пробрасываются в
 * `errorHandler` middleware (через `next(err)` от Express 5).
 */
export const accountController = {
  getById: (async (req, res) => {
    const account = await accountService.findById(req.params.id as string)
    res.json(account)
  }) as RequestHandler,

  list: (async (req, res) => {
    const groupRaw = req.query['group']
    const group = (typeof groupRaw === 'string' ? groupRaw : undefined) as string | undefined
    const accounts = await accountService.list({ group })
    res.json({ items: accounts, total: accounts.length })
  }) as RequestHandler,

  create: (async (req, res) => {
    const input = createAccountSchema.parse(req.body)
    const account = await accountService.create(input)
    res.status(201).json(account)
  }) as RequestHandler,

  update: (async (req, res) => {
    const input = updateAccountSchema.parse(req.body)
    const account = await accountService.update(req.params.id as string, input)
    res.json(account)
  }) as RequestHandler,

  delete: (async (req, res) => {
    await accountService.delete(req.params.id as string)
    res.status(204).end()
  }) as RequestHandler,
}
