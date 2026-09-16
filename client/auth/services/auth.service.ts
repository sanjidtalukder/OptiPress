import { createClient } from '@/lib/supabase/client';
import { AuthUser, AuthSession } from '../types';

export class AuthService {
  private supabase = createClient();

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error || !user) return null;
      return {
        id: user.id,
        email: user.email || '',
        createdAt: user.created_at,
      };
    } catch {
      return null;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();
      if (error || !session) return null;
      return {
        accessToken: session.access_token,
        expiresAt: session.expires_at || 0,
        user: {
          id: session.user.id,
          email: session.user.email || '',
          createdAt: session.user.created_at,
        },
      };
    } catch {
      return null;
    }
  }

  async signInWithEmail(email: string, password?: string): Promise<{ success: boolean; error?: string }> {
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async signUpWithEmail(email: string, password?: string): Promise<{ success: boolean; error?: string }> {
    if (!password) {
      return { success: false, error: 'Password is required' };
    }

    const { error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  async signOut(): Promise<{ success: boolean }> {
    await this.supabase.auth.signOut();
    return { success: true };
  }
}

export const authService = new AuthService();
