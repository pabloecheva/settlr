'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface Transaction {
  id: string;
  title: string;
  participants: string[];
  amount: number;
  currency: string;
  status: string;
  createdAt: { seconds: number };
  expiresAt: { seconds: number };
  terms: string[];
  releaseConditions: string[];
  contractAddress?: string;
  contractPdf?: string;
  smartContract?: string;
}

interface TableRow {
  id: string;
  title: string;
  parties: string[];
  keyPoints: string[];
  value: string;
  status: string;
  created: string;
  expires: string;
}

export function TransactionsTable() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      if (!user?.email) return;

      try {
        const usersRef = collection(db, 'Users');
        const userQuery = query(usersRef, where('Email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          setError('No user document found');
          setLoading(false);
          return;
        }

        const userDoc = userSnapshot.docs[0];
        const transactionsRef = collection(userDoc.ref, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);

        const formattedTransactions = transactionsSnapshot.docs.map(doc => {
          const data = doc.data() as Transaction;
          return {
            id: doc.id,
            title: data.title,
            parties: data.participants || [],
            keyPoints: [...(data.releaseConditions || []), ...(data.terms || [])],
            value: `${data.amount} ${data.currency}`,
            status: data.status,
            created: new Date(data.createdAt.seconds * 1000).toLocaleDateString(),
            expires: new Date(data.expiresAt.seconds * 1000).toLocaleDateString()
          };
        });

        setTransactions(formattedTransactions);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError(err instanceof Error ? err.message : 'Error fetching transactions');
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [user]);

  if (loading) return <div>Loading transactions...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Title & Parties</th>
          <th>Key Points</th>
          <th>Value</th>
          <th>Status</th>
          <th>Created</th>
          <th>Expires</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((row) => (
          <tr key={row.id}>
            <td>
              <div>{row.title}</div>
              <div>{row.parties.join(', ')}</div>
            </td>
            <td>
              <ul>
                {row.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </td>
            <td>{row.value}</td>
            <td>{row.status}</td>
            <td>{row.created}</td>
            <td>{row.expires}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 