'use client';

import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {mode === 'login' ? 'Sign In to OptiPress' : 'Create OptiPress Account'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === 'login'
                ? 'Access your workspace and target-size optimization presets.'
                : 'Zero permanent storage guarantee. High precision target compression.'}
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex rounded-xl bg-muted/50 p-1 border border-border">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === 'login' ? <LoginForm /> : <SignupForm />}

        <div className="border-t border-border pt-3 text-center">
          <p className="text-[11px] text-muted-foreground leading-normal">
            Strict Zero-Retention Privacy Policy. Files are processed in ephemeral memory.
          </p>
        </div>
      </div>
    </div>
  );
}
