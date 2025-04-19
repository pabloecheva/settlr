import { Timestamp } from 'firebase/firestore';

export type EscrowStatus = 'pending' | 'active' | 'completed' | 'disputed' | 'cancelled';

export interface EscrowParticipant {
  userId: string;
  email: string;
  role: 'buyer' | 'seller';
  hasApproved?: boolean; // Made optional to match implementation
  lastUpdated?: Timestamp; // Changed from Date to Timestamp and made optional
  keyPoints?: string[]; // Made optional to match implementation
}

export interface EscrowContract {
  id: string;
  title: string;
  status: EscrowStatus;
  amount: number;
  current: string; // Changed from currency to current to match implementation
  createdAt: Timestamp; // Changed from Date to Timestamp
  updatedAt?: Timestamp; // Changed from Date to Timestamp and made optional
  expiresAt: Timestamp | null; // Changed from optional Date to Timestamp | null
  participants: EscrowParticipant[];
  terms: string[];
  releaseConditions: string[];
  // Removed conditions as it's not used in implementation
  // Removed disputeResolution as it's not used in implementation
  contractAddress: string; // Made required to match implementation
  contractpdf: string; // Added to match implementation
  smartContract: string; // Added to match implementation 
  transactionHash: string; // Made required to match implementation
  summary: string; // Added to match implementation
  // Removed documents object as these fields are now at the root level
}

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  activeEscrows: string[]; // Array of escrow IDs where user is a participant
  completedEscrows: string[]; // Array of completed escrow IDs
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
  };
}

// Firestore collection paths
export const COLLECTIONS = {
  USERS: 'users',
  ESCROWS: 'escrows',
  CONTRACTS: 'contracts',
} as const; 