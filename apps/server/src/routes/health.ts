import { Router, type RequestHandler, type Router as RouterType } from 'express';
import { isMongoConnected } from '../db/mongo.js';

const startedAt = Date.now();

/** Liveness: process is up and responding. */
const liveness: RequestHandler = (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  });
};

/** Readiness: process is up AND Mongo is connected. */
const readiness: RequestHandler = (_req, res) => {
  const mongoUp = isMongoConnected();
  res.status(mongoUp ? 200 : 503).json({
    status: mongoUp ? 'ok' : 'degraded',
    mongo: mongoUp ? 'up' : 'down',
    timestamp: new Date().toISOString(),
  });
};

export function healthRouter(): RouterType {
  const r = Router();
  r.get('/health', liveness);
  r.get('/health/ready', readiness);
  return r;
}
