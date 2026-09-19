import { CorsOptions } from 'cors';
import { env } from './env.js';

const parseOrigins = (value: string): string[] => {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const allowedCorsOrigins = parseOrigins(env.CORS_ORIGIN);

export const corsOptions: CorsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin && env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    if (origin && allowedCorsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS origin not allowed.'));
  },
};

export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'", ...allowedCorsOrigins],
      fontSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginResourcePolicy: { policy: 'same-site' as const },
  hsts:
    env.NODE_ENV === 'production'
      ? {
          maxAge: 15552000,
          includeSubDomains: true,
          preload: false,
        }
      : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
};
