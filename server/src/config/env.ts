import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  MAX_UPLOAD_SIZE_MB: z.string().transform(Number).default('100'),
  TEMPORARY_STORAGE_PATH: z.string().default('./storage/temporary'),
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
