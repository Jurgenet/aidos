import { createServer, type Server } from 'node:http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { createApp } from './app.js';
import { disconnectMongo } from './db/mongo.js';

export type RunningServer = {
  server: Server;
  close: (reason?: string) => Promise<void>;
};

export function startServer(): RunningServer {
  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, env.HOST, () => {
    logger.info(
      { host: env.HOST, port: env.PORT, env: env.NODE_ENV },
      'http server listening',
    );
  });

  let closing = false;
  const close = async (reason = 'shutdown'): Promise<void> => {
    if (closing) return;
    closing = true;
    logger.info({ reason }, 'shutting down');

    const timer = setTimeout(() => {
      logger.error('shutdown timeout exceeded, forcing exit');
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);
    timer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      await disconnectMongo();
      logger.info('shutdown complete');
      setImmediate(() => process.exit(0));
    } catch (err) {
      logger.error({ err }, 'error during shutdown');
      process.exit(1);
    }
  };

  return { server, close };
}
