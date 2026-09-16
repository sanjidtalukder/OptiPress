'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { signupSchema } from '../types';
import { formatAuthError } from '../utils/auth-helpers';
import { useAuth } from '../hooks/use-auth';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // Zod Validation
    const validation = signupSchema.safeParse({ email, password, confirmPassword });
    if (!validation.success) {
      setFormError(validation.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUpWithEmail(email, password);
      if (!result.success) {
        setFormError(formatAuthError(result.error));
      } else {
        setSuccessMessage('Account created successfully! Redirecting to workspace...');
        setTimeout(() => {
          router.push('/app');
          router.refresh();
        }, 1500);
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

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-xs text-success flex items-start gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Email Input */}
      <div className="space-y-1.5">
        <label htmlFor="signup-email" className="block text-xs font-semibold text-foreground">
          Work / Personal Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="signup-email"
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
        <label htmlFor="signup-password" className="block text-xs font-semibold text-foreground">
          Password (min 6 characters)
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="signup-password"
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

      {/* Confirm Password Input */}
      <div className="space-y-1.5">
        <label htmlFor="signup-confirm-password" className="block text-xs font-semibold text-foreground">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            id="signup-confirm-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isSubmitting}
            className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
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
            <span>Creating account...</span>
          </>
        ) : (
          <span>Create Account</span>
        )}
      </Button>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
