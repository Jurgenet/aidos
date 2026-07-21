import express, { type Express } from 'express';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFound } from './middleware/not-found.js';
import { logger } from './config/logger.js';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      logger.debug(
        {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          ms: Date.now() - start,
        },
        'request',
      );
    });
    next();
  });

  app.use(apiRouter());

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
