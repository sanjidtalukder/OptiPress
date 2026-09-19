import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const requestContext = (req: Request, res: Response, next: NextFunction) => {
  const incomingId = req.header('x-request-id');
  const requestId =
    incomingId && /^[a-zA-Z0-9._-]{8,128}$/.test(incomingId)
      ? incomingId
      : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
