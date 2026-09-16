/**
 * Sanitizes Supabase Auth error messages for user-friendly UI display
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred.';

  const message = typeof error === 'object' && error !== null && 'message' in error
    ? String((error as { message: string }).message)
    : String(error);

  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }

  if (message.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  if (message.includes('Password should be at least')) {
    return 'Password is too weak. Please choose a stronger password.';
  }

  if (message.includes('Failed to fetch') || message.includes('network')) {
    return 'Network connection issue. Please check your internet connection.';
  }

  return message;
}
