import { Request, Response, NextFunction } from 'express';

const redactPath = (url: string) => {
  try {
    const parsed = new URL(url, 'http://optipress.local');
    for (const key of parsed.searchParams.keys()) {
      if (/token|key|secret|password|code/i.test(key)) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url.split('?')[0] || url;
  }
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = (req as Request & { user?: { id?: string } }).user?.id || 'anonymous';
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        requestId: req.requestId,
        method: req.method,
        path: redactPath(req.originalUrl),
        statusCode: res.statusCode,
        durationMs: duration,
        userId,
      })
    );
  });
  next();
};
