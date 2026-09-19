import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  MAX_UPLOAD_SIZE_MB: z.string().transform(Number).default('100'),
  TEMPORARY_STORAGE_PATH: z.string().default('./storage/temporary'),
  JSON_BODY_LIMIT: z.string().default('64kb'),
  URLENCODED_BODY_LIMIT: z.string().default('64kb'),
  MAX_IMAGE_PIXELS: z.string().transform(Number).default('60000000'),
  MAX_PDF_PAGE_COUNT: z.string().transform(Number).default('1000'),
  PROCESSING_TIMEOUT_MS: z.string().transform(Number).default('60000'),
  QUALITY_EVALUATION_TIMEOUT_MS: z.string().transform(Number).default('30000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_API_MAX: z.string().transform(Number).default('300'),
  RATE_LIMIT_UPLOAD_MAX: z.string().transform(Number).default('30'),
  RATE_LIMIT_PROCESSING_MAX: z.string().transform(Number).default('20'),
  RATE_LIMIT_DOWNLOAD_MAX: z.string().transform(Number).default('120'),
  RATE_LIMIT_AUTH_MAX: z.string().transform(Number).default('120'),
  SESSION_TTL_MINUTES: z.string().transform(Number).default('1440'),
  TEMP_FILE_TTL_MINUTES: z.string().transform(Number).default('60'),
  CLEANUP_INTERVAL_MINUTES: z.string().transform(Number).default('15'),
  CLEANUP_BATCH_SIZE: z.string().transform(Number).default('100'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid Server Environment Variables:', _env.error.format());
  throw new Error('Invalid environment variables in server configuration.');
}

export const env = _env.data;
