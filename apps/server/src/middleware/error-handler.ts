import type { ErrorRequestHandler } from 'express';
import { logger } from '../config/logger.js';

export class HttpError extends Error {
  public readonly status: number;
  public readonly details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: { message: err.message, details: err.details },
    });
    return;
  }

  logger.error({ err }, 'unhandled error');
  res.status(500).json({
    error: { message: 'Internal Server Error' },
  });
};
