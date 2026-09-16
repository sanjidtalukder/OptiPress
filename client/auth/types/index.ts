export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export type AuthProviderType = 'google' | 'email';

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
}

export interface IAuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithEmail(email: string, password?: string): Promise<{ success: boolean; error?: string }>;
  signUpWithEmail(email: string, password?: string): Promise<{ success: boolean; error?: string }>;
  signInWithOAuth(provider: AuthProviderType): Promise<{ success: boolean; error?: string }>;
  resetPassword(email: string): Promise<{ success: boolean; error?: string }>;
  signOut(): Promise<{ success: boolean }>;
}
