import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const errorCode = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : 'An unexpected server error occurred.';

  if (env.NODE_ENV !== 'production' && !isAppError) {
    console.error('Unhandled Error:', { requestId: req.requestId, message: err.message, stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      requestId: req.requestId,
      ...(isAppError && err.details ? { details: err.details } : {}),
    },
  });
};
