import { z } from 'zod';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const signupSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
