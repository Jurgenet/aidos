import { Router, type Router as RouterType } from 'express'
import { healthRouter } from './health.js'
import { backupsRouter } from './backups.js'
import { userRouter } from '@aid/me/user/server'
import { accountRouter } from '@aid/me/account/server'
import { noteRouter } from '@aid/me/note/server'
import { deviceRouter } from '@aid/me/device/server'

export function apiRouter(): RouterType {
  const r = Router()
  r.use(healthRouter())
  r.use(backupsRouter())
  r.use(userRouter())
  r.use(accountRouter())
  r.use(noteRouter())
  r.use(deviceRouter())
  return r
}
