import { AuthUser, AuthProviderType, IAuthService } from '../types';

/**
 * Decoupled Authentication Service Stub
 * Designed for seamless Supabase Auth plug-and-play integration in future phases.
 */
export class AuthService implements IAuthService {
  async getCurrentUser(): Promise<AuthUser | null> {
    // Architectural placeholder - returns null in Step 1
    return null;
  }

  async signInWithEmail(_email: string, _password?: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Authentication backend will be connected in Step 5 when Supabase keys are configured.',
    };
  }

  async signUpWithEmail(_email: string, _password?: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Authentication backend will be connected in Step 5 when Supabase keys are configured.',
    };
  }

  async signInWithOAuth(_provider: AuthProviderType): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'OAuth provider will be activated in Step 5.',
    };
  }

  async resetPassword(_email: string): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Password reset service ready for configuration.',
    };
  }

  async signOut(): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export const authService = new AuthService();
