'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function TestDataFetch() {
  const { user, loading } = useAuth();
  const [testData, setTestData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Don't try to fetch data while auth is still initializing
    if (loading) {
      console.log('Auth is still loading...');
      setDebugInfo({ authState: 'loading' });
      return;
    }

    async function fetchData() {
      if (!user?.email) {
        console.log('No user email found. Auth state:', { user, loading });
        setError('No user email found - you might need to log in');
        setDebugInfo({ 
          authState: { 
            user, 
            loading,
            isAuthenticated: !!user,
            email: user?.email,
            uid: user?.uid
          } 
        });
        return;
      }

      try {
        console.log('Starting data fetch test for email:', user.email);
        setDebugInfo(prev => ({ 
          ...prev, 
          userEmail: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified,
          authProvider: user.providerData[0]?.providerId
        }));

        // Get the ID token to verify auth is working
        const idToken = await user.getIdToken();
        console.log('Successfully got ID token');
        setDebugInfo(prev => ({ ...prev, hasValidToken: !!idToken }));

        // 1. First, try to find the user document
        const usersRef = collection(db, 'Users');
        const userQuery = query(usersRef, where('Email', '==', user.email));
        
        console.log('Executing query:', {
          collection: 'Users',
          where: ['Email', '==', user.email]
        });
        
        const userSnapshot = await getDocs(userQuery);

        const queryDebugInfo = {
          empty: userSnapshot.empty,
          size: userSnapshot.size,
          userEmail: user.email,
        };
        
        console.log('User query results:', queryDebugInfo);
        setDebugInfo(prev => ({ ...prev, userQuery: queryDebugInfo }));

        if (userSnapshot.empty) {
          setError('No user document found - check if email matches exactly');
          return;
        }

        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();
        console.log('Found user document:', {
          id: userDoc.id,
          data: userData
        });
        setDebugInfo(prev => ({ 
          ...prev, 
          userDoc: {
            id: userDoc.id,
            email: userData.Email
          }
        }));

        // 2. Then, get the transactions subcollection
        const transactionsRef = collection(userDoc.ref, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);

        const transactionsDebugInfo = {
          empty: transactionsSnapshot.empty,
          size: transactionsSnapshot.size,
          path: `Users/${userDoc.id}/transactions`
        };
        
        console.log('Transactions query results:', transactionsDebugInfo);
        setDebugInfo(prev => ({ ...prev, transactions: transactionsDebugInfo }));

        const transactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTestData({
          user: {
            id: userDoc.id,
            ...userData
          },
          transactions
        });

      } catch (err) {
        console.error('Error in test fetch:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        setDebugInfo(prev => ({ ...prev, error: err }));
      }
    }

    fetchData();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">Data Fetch Test</h2>
        <div className="p-4 bg-yellow-100 rounded">
          <p>Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Data Fetch Test</h2>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {debugInfo && (
        <div className="p-4 bg-yellow-100 rounded">
          <h3 className="font-bold">Debug Info:</h3>
          <pre className="mt-2 whitespace-pre-wrap text-sm">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      {testData && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold">User Document:</h3>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(testData.user, null, 2)}
            </pre>
          </div>

          <div className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold">Transactions ({testData.transactions.length}):</h3>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(testData.transactions, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {!testData && !error && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
} 