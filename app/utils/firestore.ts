import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { COLLECTIONS, UserProfile } from '@/app/types/database';

// Type definitions
export enum EscrowStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export interface EscrowParticipant {
  email: string;
  role: 'buyer' | 'seller';
  userId: string;
  keyPoints?: string[];
  lastUpdated?: Timestamp;
  hasApproved?: boolean;
}

export interface EscrowContract {
  id: string;
  title: string;
  amount: number;
  contractAddress: string;
  contractpdf: string;
  createdAt: Timestamp;
  current: string;
  expiresAt: Timestamp | null;
  participants: EscrowParticipant[];
  releaseConditions: string[];
  smartContract: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';
  summary: string;
  terms: string[];
  transactionHash: string;
}

// TransactionWithParticipants is now redundant since EscrowContract already uses EscrowParticipant[]
// Keeping it for backward compatibility
export interface TransactionWithParticipants extends EscrowContract {}

// User Operations
export async function getUserTransactionsWithProfiles(userEmail: string): Promise<EscrowContract[]> {
  try {
    console.log('Fetching transactions for user email:', userEmail);
    
    // Query the ESCROWS collection directly to find contracts where the user is a participant
    const escrowsRef = collection(db, COLLECTIONS.ESCROWS);
    
    // First approach: Try to find escrows where the participant email matches
    const escrowsSnapshot = await getDocs(escrowsRef);
    
    console.log('Processing escrows to find those with user email:', userEmail);
    
    const transactions: EscrowContract[] = [];
    
    // Filter and process the escrows
    for (const doc of escrowsSnapshot.docs) {
      const data = doc.data();
      
      // Check if this escrow has the user as a participant
      const hasUserAsParticipant = Array.isArray(data.participants) && 
        data.participants.some((p: any) => {
          // Check if participant is an object with email property
          if (typeof p === 'object' && p !== null && 'email' in p) {
            return p.email === userEmail;
          }
          // Check if participant is a string (email directly)
          if (typeof p === 'string') {
            return p === userEmail;
          }
          return false;
        });
      
      if (!hasUserAsParticipant) {
        continue; // Skip this escrow
      }
      
      console.log('Found matching escrow:', doc.id);
      
      // Process participants to ensure they match the EscrowParticipant structure
      const participants = Array.isArray(data.participants) 
        ? data.participants.map((p: any) => {
            // If p is a string, convert it to a basic EscrowParticipant object
            if (typeof p === 'string') {
              return {
                email: p,
                role: 'buyer' as const, // Default role
                userId: '', // Empty userId
              };
            }
            // If p is already an object, ensure it has the required fields
            return {
              email: p.email || '',
              role: (p.role === 'buyer' || p.role === 'seller') ? p.role : 'buyer' as const,
              userId: p.userId || '',
              keyPoints: Array.isArray(p.keyPoints) ? p.keyPoints : [],
              lastUpdated: p.lastUpdated instanceof Timestamp ? p.lastUpdated : Timestamp.now(),
              hasApproved: !!p.hasApproved,
            };
          })
        : [];
      
      // Create properly typed escrow contract
      const escrowContract: EscrowContract = {
        id: doc.id,
        title: data.title || '',
        amount: typeof data.amount === 'number' ? data.amount : 0,
        contractAddress: data.contractAddress || '',
        contractpdf: data.contractpdf || '',
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
        current: data.current || 'ETH',
        expiresAt: data.expiresAt instanceof Timestamp ? data.expiresAt : null,
        participants, // This is now a properly formatted EscrowParticipant array
        releaseConditions: Array.isArray(data.releaseConditions) ? data.releaseConditions : [],
        smartContract: data.smartContract || '',
        status: isValidStatus(data.status) ? data.status : 'pending',
        summary: data.summary || '',
        terms: Array.isArray(data.terms) ? data.terms : [],
        transactionHash: data.transactionHash || '',
      };
      
      transactions.push(escrowContract);
    }
    
    console.log('Found and processed matching escrows:', transactions.length);
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    // Return empty array rather than throwing, to avoid breaking the UI
    return [];
  }
}

/**
 * Helper function to check if a status is valid
 */
function isValidStatus(status: any): status is EscrowContract['status'] {
  return typeof status === 'string' && 
    ['pending', 'active', 'completed', 'cancelled', 'disputed'].includes(status);
}

/**
 * Update the status of an escrow contract
 */
export async function updateEscrowStatus(
  escrowId: string, 
  status: EscrowContract['status']
): Promise<void> {
  const escrowRef = doc(db, COLLECTIONS.ESCROWS, escrowId);
  const escrowDoc = await getDoc(escrowRef);

  if (!escrowDoc.exists()) {
    throw new Error('Escrow contract not found');
  }

  const escrow = escrowDoc.data() as EscrowContract;

  // If the escrow is being completed, update the users' arrays
  if (status === 'completed') {
    await Promise.all(
      escrow.participants.map(async (participant) => {
        if (!participant.userId) return; // Skip if no userId
        
        const userRef = doc(db, COLLECTIONS.USERS, participant.userId);
        await updateDoc(userRef, {
          activeEscrows: arrayRemove(escrowId),
          completedEscrows: arrayUnion(escrowId),
          updatedAt: Timestamp.now(),
        });
      })
    );
  }

  // Update the escrow status
  await updateDoc(escrowRef, {
    status,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Create a new escrow contract
 */
export async function createEscrowContract(escrowData: Omit<EscrowContract, 'id' | 'createdAt'>): Promise<string> {
  try {
    const escrowsRef = collection(db, COLLECTIONS.ESCROWS);
    
    // Ensure participants are correctly formatted
    const participants = escrowData.participants.map(p => ({
      email: p.email,
      role: p.role,
      userId: p.userId || '',
      keyPoints: Array.isArray(p.keyPoints) ? p.keyPoints : [],
      lastUpdated: Timestamp.now(),
      hasApproved: !!p.hasApproved,
    }));
    
    const docRef = await addDoc(escrowsRef, {
      ...escrowData,
      participants,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: escrowData.status || 'pending',
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating escrow contract:', error);
    throw error;
  }
}

/**
 * Update an escrow contract
 */
export async function updateEscrowContract(
  escrowId: string,
  updates: Partial<Omit<EscrowContract, 'id' | 'createdAt'>>
): Promise<void> {
  const escrowRef = doc(db, COLLECTIONS.ESCROWS, escrowId);
  
  await updateDoc(escrowRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Update a participant's key points in an escrow
 */
export async function updateParticipantKeyPoints(
  escrowId: string,
  userId: string,
  keyPoints: string[]
): Promise<void> {
  const escrowRef = doc(db, COLLECTIONS.ESCROWS, escrowId);
  const escrowDoc = await getDoc(escrowRef);

  if (!escrowDoc.exists()) {
    throw new Error('Escrow contract not found');
  }

  const escrow = escrowDoc.data() as EscrowContract;
  const participantIndex = escrow.participants.findIndex(p => p.userId === userId);

  if (participantIndex === -1) {
    throw new Error('Participant not found in escrow contract');
  }

  const updatedParticipants = [...escrow.participants];
  updatedParticipants[participantIndex] = {
    ...updatedParticipants[participantIndex],
    keyPoints,
    lastUpdated: Timestamp.now(),
  };

  await updateDoc(escrowRef, {
    participants: updatedParticipants,
    updatedAt: Timestamp.now(),
  });
}
