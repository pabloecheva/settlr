'use client';

import React, { useEffect, useState, useCallback, ErrorInfo, ReactNode } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { EscrowContract, getUserTransactionsWithProfiles } from '@/app/utils/firestore';
import { Timestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { EscrowStatus } from '@/app/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error in TransactionsList component:", error);
    console.error("Component stack:", errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface TermItem {
  text: string;
  type: 'term' | 'condition';
}

// Helper function to safely format dates
function formatDate(timestamp: Timestamp | null): string {
  if (!timestamp) return '-';
  if (!timestamp.toDate) {
    console.error('Invalid timestamp object:', timestamp);
    return '-';
  }
  try {
    return timestamp.toDate().toLocaleDateString();
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}

// Helper function to safely check if a value is an array
function isValidArray(value: any): boolean {
  return Array.isArray(value);
}

// Type guard for EscrowContract
function isValidEscrowContract(obj: any): obj is EscrowContract {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.amount === 'number' &&
    obj.participants !== undefined
  );
}

// Function to validate a transaction and return validation results
function validateTransaction(transaction: any, index: number) {
  if (!isValidEscrowContract(transaction)) {
    return {
      index,
      valid: false,
      reason: 'Not a valid EscrowContract object',
      type: typeof transaction
    };
  }
  
  const termCheck = isValidArray(transaction.terms) ? 'valid' : `invalid: ${typeof transaction.terms}`;
  const conditionCheck = isValidArray(transaction.releaseConditions) ? 'valid' : `invalid: ${typeof transaction.releaseConditions}`;
  const participantsCheck = isValidArray(transaction.participants) ? 'valid' : `invalid: ${typeof transaction.participants}`;
  
  return { 
    id: transaction.id,
    termsValid: termCheck,
    conditionsValid: conditionCheck,
    participantsValid: participantsCheck,
    createdAtValid: transaction.createdAt instanceof Timestamp ? 'valid' : `invalid: ${typeof transaction.createdAt}`,
    expiresAtValid: transaction.expiresAt === null || transaction.expiresAt instanceof Timestamp ? 'valid' : `invalid: ${typeof transaction.expiresAt}`
  };
}

export function TransactionsList() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const loadTransactions = useCallback(async () => {
    if (!user?.email) {
      console.log('No user email available, skipping transaction fetch');
      setLoading(false);
      return;
    }

    console.log('Starting transaction fetch for user:', user.email);
    setDebugInfo(prev => ({ ...prev, userEmail: user.email }));

    try {
      // Fetch transactions with debug logging
      console.log('Calling getUserTransactionsWithProfiles...');
      const userTransactions = await getUserTransactionsWithProfiles(user.email);
      console.log('Received transactions:', userTransactions);
      
      // Validate the returned data
      if (!isValidArray(userTransactions)) {
        console.error('getUserTransactionsWithProfiles did not return an array:', userTransactions);
        setError('Invalid data format received from server');
        setDebugInfo(prev => ({ 
          ...prev, 
          error: 'Not an array', 
          receivedValue: typeof userTransactions 
        }));
        setTransactions([]);
        return;
      }
      
      // Validate each transaction 
      const validationResults = userTransactions.map((transaction, index) => 
        validateTransaction(transaction, index)
      );
      
      console.log('Transaction validation results:', validationResults);
      setDebugInfo(prev => ({ ...prev, validationResults }));
      
      // Filter out any invalid transaction objects
      const validTransactions = userTransactions.filter(isValidEscrowContract);
      
      if (validTransactions.length < userTransactions.length) {
        console.warn(`Filtered out ${userTransactions.length - validTransactions.length} invalid transaction objects`);
        setDebugInfo(prev => ({ 
          ...prev, 
          filteredCount: userTransactions.length - validTransactions.length,
          originalLength: userTransactions.length,
          validLength: validTransactions.length
        }));
      }
      
      // Set the validated transactions
      setTransactions(validTransactions);

    } catch (error) {
      console.error('Error loading transactions:', error);
      setError('Failed to load transactions');
      setDebugInfo(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h3 className="font-bold">Error:</h3>
        <p>{error}</p>
        {debugInfo && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">Debug information</summary>
            <pre className="mt-2 text-xs overflow-auto bg-gray-100 p-2 rounded">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
        <button 
          onClick={() => {
            setError(null);
            setLoading(true);
            loadTransactions();
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isValidArray(transactions) || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  // Wrap the table in an error boundary
  return (
    <ErrorBoundary fallback={
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h3 className="font-bold">Rendering Error</h3>
        <p>An error occurred while displaying your transactions.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Reload page
        </button>
      </div>
    }>
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title & Summary</TableHead>
              <TableHead>Terms & Conditions</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Contract</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div className="font-medium">{transaction.title || 'Untitled'}</div>
                  <div className="text-sm text-muted-foreground">
                    {transaction.summary || 'No summary available'}
                  </div>
                </TableCell>
                <TableCell>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {isValidArray(transaction.terms) && transaction.terms.map((term: string, index: number) => (
                      <li key={`term-${index}`}>{term}</li>
                    ))}
                    {isValidArray(transaction.releaseConditions) && transaction.releaseConditions.map((condition: string, index: number) => (
                      <li key={`condition-${index}`} className="text-muted-foreground">
                        {condition}
                      </li>
                    ))}
                    {(!isValidArray(transaction.terms) && !isValidArray(transaction.releaseConditions)) && (
                      <li className="text-muted-foreground">No terms or conditions available</li>
                    )}
                  </ul>
                </TableCell>
                <TableCell>
                  {transaction.amount} {transaction.current || 'USD'}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(transaction.status)}>
                    {transaction.status || 'pending'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDate(transaction.createdAt)}
                </TableCell>
                <TableCell>
                  {formatDate(transaction.expiresAt)}
                </TableCell>
                <TableCell className="text-right">
                  {transaction.contractAddress && (
                    <span className="text-xs text-muted-foreground">
                      {transaction.contractAddress}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ErrorBoundary>
  );
}

function getStatusVariant(status: EscrowStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
      return 'default';
    case 'active':
      return 'secondary';
    case 'disputed':
      return 'destructive';
    default:
      return 'outline';
  }
} 
