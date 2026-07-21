import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let connected = false;

mongoose.connection.on('connected', () => {
  connected = true;
  logger.info({ db: env.MONGO_DB_NAME }, 'mongo connected');
});

mongoose.connection.on('disconnected', () => {
  connected = false;
  logger.warn('mongo disconnected');
});

mongoose.connection.on('error', (err: unknown) => {
  connected = false;
  logger.error({ err }, 'mongo error');
});

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.MONGO_URI, {
    dbName: env.MONGO_DB_NAME,
    serverSelectionTimeoutMS: 5_000,
  });
}

export async function disconnectMongo(): Promise<void> {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
}

export function isMongoConnected(): boolean {
  return connected && mongoose.connection.readyState === 1;
}
