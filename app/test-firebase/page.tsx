'use client';

import { useState } from 'react';
import { createTransaction } from '@/lib/firestore';
import { Transaction } from '@/lib/types';

export default function TestFirebase() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const testCreateTransaction = async () => {
    setLoading(true);
    try {
      const testTransaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'Test Transaction',
        description: 'This is a test transaction',
        status: 'draft',
        parties: [
          {
            id: 'test-user-1',
            email: 'test1@example.com',
            name: 'Test User 1',
            signed: false
          },
          {
            id: 'test-user-2',
            email: 'test2@example.com',
            name: 'Test User 2',
            signed: false
          }
        ],
        dealFiles: [],
        smartContract: {
          code: '// Test contract code',
          deploymentScript: '// Test deployment script'
        },
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: 'test-user-1'
      };

      const result = await createTransaction(testTransaction);
      setMessage('Transaction created successfully! ID: ' + result.id);
    } catch (error) {
      setMessage('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Firebase Test Page</h1>
      <button
        onClick={testCreateTransaction}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Test Transaction'}
      </button>
      {message && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          {message}
        </div>
      )}
    </div>
  );
} 