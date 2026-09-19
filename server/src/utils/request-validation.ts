import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const sessionIdSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[a-zA-Z0-9_-]+$/);

export const downloadTypeSchema = z.enum(['result', 'original']).default('result');

export const isValidUuid = (value: string) => uuidSchema.safeParse(value).success;

export const isValidSessionId = (value: string) => sessionIdSchema.safeParse(value).success;
