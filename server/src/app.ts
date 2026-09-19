import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { corsOptions, helmetOptions } from './config/security.js';
import { createRateLimiter } from './middleware/rate-limit.js';
import { requestContext } from './middleware/request-context.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/error.js';
import { healthRouter } from './routes/health.router.js';
import { sessionRouter } from './routes/session.router.js';
import { fileRouter } from './routes/file.router.js';
import { imageRouter } from './routes/image.router.js';
import { pdfRouter } from './routes/pdf.router.js';
import { historyRouter } from './routes/history.router.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');

  // Security & Middleware
  app.use(requestContext);
  app.use(helmet(helmetOptions));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.JSON_BODY_LIMIT, strict: true }));
  app.use(express.urlencoded({ extended: false, limit: env.URLENCODED_BODY_LIMIT }));
  app.use(requestLogger);

  const apiLimiter = createRateLimiter({
    keyPrefix: 'api',
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_API_MAX,
  });
  const authLimiter = createRateLimiter({
    keyPrefix: 'auth',
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_AUTH_MAX,
  });
  const uploadLimiter = createRateLimiter({
    keyPrefix: 'upload',
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_UPLOAD_MAX,
  });
  const processingLimiter = createRateLimiter({
    keyPrefix: 'processing',
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_PROCESSING_MAX,
  });
  const downloadLimiter = createRateLimiter({
    keyPrefix: 'download',
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_DOWNLOAD_MAX,
  });

  // Health endpoint strictly returning {"status": "ok"}
  app.use('/health', healthRouter);

  app.use('/api', apiLimiter);
  app.use(['/api/me', '/api/auth', '/api/session', '/api/sessions'], authLimiter);

  // API Authentication & Session Routes
  app.use('/api', sessionRouter);

  // API Temporary File Routes
  app.use('/api/files/upload', uploadLimiter);
  app.use('/api/files/:id/download', downloadLimiter);
  app.use('/api/files', fileRouter);

  // API Temporary History Routes
  app.use('/api/history', historyRouter);

  // API Image Optimization Routes
  app.use('/api/images', processingLimiter, imageRouter);

  // API PDF Optimization Routes
  app.use('/api/pdfs', processingLimiter, pdfRouter);

  // Error handling middleware
  app.use(errorHandler);

  return app;
};
