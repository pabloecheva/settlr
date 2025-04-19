'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Set loading to false regardless of auth state
      setIsLoading(false);
      
      if (user) {
        // User is signed in, get the ID token
        user.getIdToken().then((token) => {
          // Set the session cookie
          document.cookie = `session=${token}; path=/; max-age=3600; secure; samesite=strict`;
        });
      } else {
        // User is signed out, clear the session cookie
        document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
} 