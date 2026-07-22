import { Router, type Router as RouterType } from 'express'
import { healthRouter } from './health.js'
import { userRouter } from '@aid/md/user/server'
import { accountRouter } from '@aid/md/account/server'
import { noteRouter } from '@aid/md/note/server'

export function apiRouter(): RouterType {
  const r = Router()
  r.use(healthRouter())
  r.use(userRouter())
  r.use(accountRouter())
  r.use(noteRouter())
  return r
}
