import type { RequestHandler } from 'express'
import { HttpError } from '@aid/md/shared/http-error'

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'Not Found'))
}
