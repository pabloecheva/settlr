import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError as FirebaseAuthError
} from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

export interface AuthError {
  code: string;
  message: string;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  try {
    console.log('Attempting login with email:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Login successful:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    const authError = error as FirebaseAuthError;
    throw {
      code: authError.code,
      message: getAuthErrorMessage(authError.code)
    };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  try {
    console.log('Attempting signup with email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Signup successful:', userCredential.user.email);
    return userCredential.user;
  } catch (error) {
    console.error('Signup error:', error);
    const authError = error as FirebaseAuthError;
    throw {
      code: authError.code,
      message: getAuthErrorMessage(authError.code)
    };
  }
}

export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
    console.log('Logout successful');
    // Clear session cookie
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Helper function to get user-friendly error messages
function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password is too weak. It should be at least 6 characters.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'An error occurred during authentication.';
  }
} 