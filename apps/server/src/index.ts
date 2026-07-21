import { startServer } from './server.js';
import { connectMongo } from './db/mongo.js';
import { logger } from './config/logger.js';
import { env } from './config/env.js';

async function main(): Promise<void> {
  logger.info({ env: env.NODE_ENV, pid: process.pid }, 'starting server');

  // Try to connect to Mongo, but don't crash if it's down at boot —
  // /health/ready will reflect the real state and k8s/Compose can retry.
  try {
    await connectMongo();
  } catch (err) {
    logger.error({ err }, 'failed to connect to mongo on boot, continuing in degraded mode');
  }

  const { close } = startServer();

  const handleSignal = (signal: NodeJS.Signals): void => {
    logger.info({ signal }, 'received signal');
    void close(signal);
  };

  process.on('SIGTERM', handleSignal);
  process.on('SIGINT', handleSignal);

  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaught exception');
    void close('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'unhandled rejection');
    void close('unhandledRejection');
  });
}

void main();
