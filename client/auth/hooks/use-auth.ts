'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthUser, AuthSession } from '../types';
import { authService } from '../services/auth.service';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (isMounted) {
          if (initialSession) {
            setSession({
              accessToken: initialSession.access_token,
              expiresAt: initialSession.expires_at || 0,
              user: {
                id: initialSession.user.id,
                email: initialSession.user.email || '',
                createdAt: initialSession.user.created_at,
              },
            });
            setUser({
              id: initialSession.user.id,
              email: initialSession.user.email || '',
              createdAt: initialSession.user.created_at,
            });
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Auth initialization failed');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        setSession({
          accessToken: currentSession.access_token,
          expiresAt: currentSession.expires_at || 0,
          user: {
            id: currentSession.user.id,
            email: currentSession.user.email || '',
            createdAt: currentSession.user.created_at,
          },
        });
        setUser({
          id: currentSession.user.id,
          email: currentSession.user.email || '',
          createdAt: currentSession.user.created_at,
        });
      } else {
        setSession(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.signInWithEmail(email, password);
    if (!result.success && result.error) {
      setError(result.error);
    }
    setIsLoading(false);
    return result;
  };

  const signUpWithEmail = async (email: string, password?: string) => {
    setIsLoading(true);
    setError(null);
    const result = await authService.signUpWithEmail(email, password);
    if (!result.success && result.error) {
      setError(result.error);
    }
    setIsLoading(false);
    return result;
  };

  const signOut = async () => {
    setIsLoading(true);
    const result = await authService.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
    return result;
  };

  return {
    user,
    session,
    isAuthenticated: Boolean(user),
    isLoading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}
