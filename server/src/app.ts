import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error.js';
import { healthRouter } from './routes/health.router.js';
import { sessionRouter } from './routes/session.router.js';

export const createApp = () => {
  const app = express();

  // Security & Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(requestLogger);

  // Health endpoint strictly returning {"status": "ok"}
  app.use('/health', healthRouter);

  // API Authentication & Session Routes
  app.use('/api', sessionRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};
