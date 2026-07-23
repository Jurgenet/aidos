import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '@aid/me/shared/http-error'
import { logger } from '../config/logger.js'

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, details: err.details },
    })
    return
  }

  if (err instanceof ZodError) {
    logger.warn({ issues: err.issues }, 'zod validation failed')
    res.status(400).json({
      error: { message: 'Invalid request', details: err.format() },
    })
    return
  }

  logger.error({ err }, 'unhandled error')
  res.status(500).json({
    error: { message: 'Internal Server Error' },
  })
}
