export type EscrowStatus = 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';

export interface EscrowParticipant {
  userId: string;
  email: string;
  role: 'buyer' | 'seller';
  hasApproved: boolean;
  lastUpdated: any;
  keyPoints: string[];
}

export interface EscrowContract {
  id: string;
  title: string;
  status: "pending" | "active" | "completed" | "disputed" | "cancelled";
  amount: number;
  currency: string;
  createdAt: Date;
  expiresAt?: Date;
  participants: EscrowParticipant[];
  terms: string[];
  contractAddress?: string; // Ethereum smart contract address
  transactionHash?: string; // Ethereum transaction hash
  
  contractPdf?: string; // URL to stored PDF
  smartContract?: string; // Solidity contract code
  summary?: string; // Contract summary
  
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  activeEscrows: string[]; // Array of escrow IDs where user is a participant
  completedEscrows: string[]; // Array of completed escrow IDs
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
  };
  transactions?: string[]; // Array of transaction IDs
}

// Firestore collection paths
export const COLLECTIONS = {
  USERS: 'users' as const,
  ESCROWS: 'escrows' as const,
  CONTRACTS: 'contracts' as const,
  TRANSACTIONS: 'transactions' as const,
} as const; 