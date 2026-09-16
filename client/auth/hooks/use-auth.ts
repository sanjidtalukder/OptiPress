'use client';

import { useState } from 'react';
import { AuthUser, AuthState } from '../types';
import { authService } from '../services/auth.service';

export function useAuth() {
  const [state] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: false,
    error: null,
  });

  const signInWithEmail = (email: string) => authService.signInWithEmail(email);
  const signInWithOAuth = (provider: 'google') => authService.signInWithOAuth(provider);
  const signOut = () => authService.signOut();

  return {
    user: state.user,
    isAuthenticated: Boolean(state.user),
    isLoading: state.isLoading,
    error: state.error,
    signInWithEmail,
    signInWithOAuth,
    signOut,
  };
}
