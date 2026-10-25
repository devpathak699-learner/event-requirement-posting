import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';
import { createRequirementsRouter } from './routes/requirements.js';
import { errorHandler, notFound } from './middleware/errors.js';

export function createApp({ corsOrigins = [], logRequests = true, createLimit } = {}) {
  const app = express();

  app.set('trust proxy', 1); // behind Render's proxy; needed to rate-limit by real client IP
  app.use(helmet());
  // An empty allow-list means "allow any origin" (local development only).
  app.use(cors({ origin: corsOrigins.length ? corsOrigins : true }));
  app.use(express.json({ limit: '50kb' }));
  if (logRequests) app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({ status: dbConnected ? 'ok' : 'degraded', db: dbConnected });
  });

  app.use('/api/requirements', createRequirementsRouter({ createLimit }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
