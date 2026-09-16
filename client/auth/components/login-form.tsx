'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginSchema } from '../types';
import { formatAuthError } from '../utils/auth-helpers';
import { useAuth } from '../hooks/use-auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Zod Validation
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      setFormError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);
      if (!result.success) {
        setFormError(formatAuthError(result.error));
      } else {
        router.push(redirectUrl);
        router.refresh();
      }
    } catch (err) {
      setFormError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-start gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label htmlFor="login-email" className="block text-xs font-semibold text-foreground">
          Work / Personal Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            disabled={isSubmitting}
            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
        </div>
      </div>

      {/* Password Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="block text-xs font-semibold text-foreground">
            Password
          </label>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isSubmitting}
            className="w-full pl-10 pr-10 py-2 text-sm rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full font-semibold shadow-md py-2.5 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing in...</span>
          </>
        ) : (
          <span>Sign In</span>
        )}
      </Button>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        Don&apos;t have an OptiPress account?{' '}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Create account
        </Link>
      </div>
    </form>
  );
}
