import { FirebaseError } from 'firebase/app'

/**
 * Map Firebase Auth error codes to user-friendly messages.
 * Raw Firebase errors look like "Firebase: Error (auth/wrong-password)."
 * which is confusing for end users.
 */
const MESSAGES: Record<string, string> = {
  // Sign-in errors
  'auth/invalid-email': 'That email address doesn\'t look right. Double-check and try again.',
  'auth/user-not-found': 'No account found with that email. Want to sign up instead?',
  'auth/wrong-password': 'Incorrect password. Try again or use "Forgot password?" to reset it.',
  'auth/invalid-credential': 'Incorrect email or password. Try again or use "Forgot password?" to reset it.',
  'auth/invalid-login-credentials': 'Incorrect email or password. Try again or use "Forgot password?" to reset it.',
  'auth/user-disabled': 'This account has been disabled. Contact your property manager for help.',
  'auth/too-many-requests': 'Too many failed attempts. Wait a few minutes, or reset your password to unlock your account.',

  // Sign-up errors
  'auth/email-already-in-use': 'An account with that email already exists. Try signing in instead.',
  'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
  'auth/operation-not-allowed': 'Sign-ups are temporarily disabled. Please try again later or contact support.',

  // Shared
  'auth/network-request-failed': 'Network error. Check your internet connection and try again.',
  'auth/requires-recent-login': 'For your security, please sign in again before making this change.',
  'auth/popup-closed-by-user': 'Sign-in window was closed before finishing. Please try again.',
  'auth/internal-error': 'Something went wrong on our end. Please try again in a moment.',
}

export function friendlyAuthError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof FirebaseError) {
    return MESSAGES[err.code] ?? fallback
  }
  if (err instanceof Error && err.message.includes('auth/')) {
    const match = err.message.match(/auth\/[a-z-]+/)
    if (match && MESSAGES[match[0]]) return MESSAGES[match[0]]
  }
  return fallback
}
