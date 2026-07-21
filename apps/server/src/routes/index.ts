import { Router, type Router as RouterType } from 'express'
import { healthRouter } from './health.js'

export function apiRouter(): RouterType {
  const r = Router()
  r.use(healthRouter())
  return r
}
