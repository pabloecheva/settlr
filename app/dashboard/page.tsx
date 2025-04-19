'use client'

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EscrowList } from "@/components/EscrowList"
import { CreateEscrowDialog } from "@/components/CreateEscrowDialog"
import { useAuth } from '@/app/hooks/useAuth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { 
  ChevronDown, 
  Filter, 
  Search, 
  Settings, 
  User,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

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
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchTransactions() {
      if (!user?.email) return;

      try {
        const usersRef = collection(db, 'Users');
        const userQuery = query(usersRef, where('Email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const transactionsRef = collection(userDoc.ref, 'transactions');
          const transactionsSnapshot = await getDocs(transactionsRef);

          const fetchedTransactions = transactionsSnapshot.docs.map(doc => {
            const data = doc.data() as Transaction;
            return {
              ...data,
              id: doc.id
            };
          });

          setTransactions(fetchedTransactions);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setLoading(false);
      }
    }

    fetchTransactions();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Settlr</h1>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card px-4 py-6">
          <nav className="space-y-2">
            <a href="#" className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-accent-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
              Dashboard
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Active Escrows
            </a>
            <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
              </svg>
              History
            </a>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto py-6">
            <div className="mb-8 flex items-center justify-between">
              <div className="relative w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search escrows..."
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" className="gap-2">
                  Sort by
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
                <CreateEscrowDialog />
              </div>
            </div>

            {/* Stats */}
            <div className="mb-8">
              <h2 className="mb-4 text-lg font-semibold">Overview</h2>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Escrows</p>
                      <h3 className="mt-1 text-2xl font-semibold">
                        {transactions.filter(t => t.status === 'active').length}
                      </h3>
                    </div>
                    <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>2.1%</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Review</p>
                      <h3 className="mt-1 text-2xl font-semibold">
                        {transactions.filter(t => t.status === 'pending').length}
                      </h3>
                    </div>
                    <div className="flex items-center text-sm text-destructive">
                      <ArrowDownRight className="h-4 w-4" />
                      <span>0.4%</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Value Locked</p>
                      <h3 className="mt-1 text-2xl font-semibold">
                        {transactions.reduce((sum, t) => sum + t.amount, 0)} ETH
                      </h3>
                    </div>
                    <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>1.8%</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <h3 className="mt-1 text-2xl font-semibold">
                        {transactions.filter(t => t.status === 'completed').length}
                      </h3>
                    </div>
                    <div className="flex items-center text-sm text-emerald-500">
                      <ArrowUpRight className="h-4 w-4" />
                      <span>3.2%</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="space-y-4">
              <div className="rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title & Parties</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{transaction.title}</div>
                            <div className="text-sm text-gray-500">{transaction.participants.join(', ')}</div>
                          </td>
                          <td className="px-6 py-4">
                            <ul className="text-sm text-gray-500 list-disc list-inside">
                              {transaction.releaseConditions?.map((condition, i) => (
                                <li key={i}>{condition}</li>
                              ))}
                              {transaction.terms?.map((term, i) => (
                                <li key={`term-${i}`}>{term}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {transaction.amount} {transaction.currency}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${transaction.status === 'active' ? 'bg-green-100 text-green-800' : 
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-gray-100 text-gray-800'}`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(transaction.createdAt.seconds * 1000).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(transaction.expiresAt.seconds * 1000).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 