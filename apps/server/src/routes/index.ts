import { Router, type Router as RouterType } from 'express'
import { healthRouter } from './health.js'
import { userRouter } from '@aid/md/user/server'

export function apiRouter(): RouterType {
  const r = Router()
  r.use(healthRouter())
  r.use(userRouter())
  return r
}
