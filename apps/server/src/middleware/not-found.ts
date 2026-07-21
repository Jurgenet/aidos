import type { RequestHandler } from 'express'
import { HttpError } from './error-handler.js'

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'Not Found'))
}
