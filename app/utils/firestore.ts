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
import { COLLECTIONS, UserProfile, EscrowParticipant, EscrowStatus } from '@/app/types/database';

// Type definitions
export enum EscrowStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
}

export interface EscrowContract {
  id?: string;
  title: string;
  amount: number;
  contractAddress?: string;
  contractpdf?: string;
  createdAt: Timestamp;
  current?: string;
  expiresAt: Timestamp | null;
  participants: EscrowParticipant[];
  releaseConditions?: string[];
  smartContract?: string;
  status: EscrowStatus;
  summary?: string;
  terms?: string[];
  transactionHash?: string;
}

// TransactionWithParticipants is now redundant since EscrowContract already uses EscrowParticipant[]
// Keeping it for backward compatibility
export interface TransactionWithParticipants extends EscrowContract {}

// User Operations
export async function getUserTransactionsWithProfiles(userEmail: string): Promise<EscrowContract[]> {
  try {
    console.log('Fetching user profile for email:', userEmail);
    
    // Query the users collection to find the user's document ID
    const usersRef = collection(db, COLLECTIONS.USERS);
    const q = query(usersRef, where('email', '==', userEmail));
    const userSnapshot = await getDocs(q);
    
    if (userSnapshot.empty) {
      console.log('No user found with email:', userEmail);
      return [];
    }
    
    const userDoc = userSnapshot.docs[0];
    const userId = userDoc.id; // Get the actual User Document ID
    console.log(`Found user ID: ${userId}`);

    // Path to the user's transactions subcollection
    const transactionsPath = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS);
    console.log(`Fetching transactions from path: ${transactionsPath.path}`);

    // Get all documents from the subcollection
    const transactionsSnapshot = await getDocs(transactionsPath);
    
    const transactions: EscrowContract[] = [];
    transactionsSnapshot.forEach((doc) => {
      // Important: Ensure data matches EscrowContract interface
      // Convert Timestamps if necessary, handle missing fields
      const data = doc.data() as EscrowContract;
      transactions.push({
        ...data,
        id: doc.id, // Add the document ID from the subcollection
      });
    });

    console.log(`Fetched ${transactions.length} transactions for user ${userId}`);
    return transactions;

  } catch (error) {
    console.error('Error fetching transactions for email:', userEmail, error);
    return []; // Return empty array on error
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

// Type definition for the data needed to create an escrow in the subcollection
interface CreateEscrowData extends Omit<EscrowContract, 'id' | 'createdAt' | 'status'> {
  expiresAt: Timestamp | null;
  participants: EscrowParticipant[];
  creatorUserId: string;
  status?: EscrowStatus;
}

/**
 * Finds a user ID by email.
 * @param email The email to search for.
 * @returns The user ID string or null if not found.
 */
async function findUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('email', '==', email));
  const userSnapshot = await getDocs(q);
  if (!userSnapshot.empty) {
    return userSnapshot.docs[0].id; // Return the document ID
  }
  return null;
}

/**
 * Create a new escrow contract and add it to EACH participant's transaction subcollection.
 */
export async function createEscrowContract(data: CreateEscrowData): Promise<string | null> { // Return type might change
  const { participants, ...escrowData } = data;

  if (!participants || participants.length === 0) {
    throw new Error("Participants list is required to create an escrow contract.");
  }

  let firstDocId: string | null = null; // To store the ID of the first document created

  try {
    // Prepare the core transaction data once
    const transactionData = {
      ...escrowData,
      participants: participants.map(p => ({ // Convert participant dates
        ...p,
        lastUpdated: Timestamp.fromDate(p.lastUpdated)
      })),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: escrowData.status || EscrowStatus.PENDING,
    };

    // Iterate through each participant provided in the creation data
    for (const participant of participants) {
      const userId = await findUserIdByEmail(participant.email);

      if (userId) {
        console.log(`Found user ID ${userId} for email ${participant.email}. Adding transaction...`);
        // Path to this specific user's transactions subcollection
        const userTransactionsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.TRANSACTIONS);
        
        // Add the transaction document to their subcollection
        const docRef = await addDoc(userTransactionsRef, transactionData);
        console.log(`Transaction ${docRef.id} added to user ${userId}'s subcollection.`);
        
        if (!firstDocId) {
          firstDocId = docRef.id; // Store the first ID created (useful for redirection)
        }

      } else {
        console.warn(`User not found for email ${participant.email}. Cannot add transaction to their subcollection.`);
        // Decide how to handle this: error out, notify, or just skip?
        // For now, we just log a warning.
      }
    }

    if (!firstDocId) {
      // This means no user was found for any participant, which is an error state.
      throw new Error("Could not find any participating users in the database.");
    }

    return firstDocId; // Return the ID created for the first participant found

  } catch (error) {
    console.error(`Error creating escrow contract and adding to participant subcollections:`, error);
    throw error; // Rethrow the error
  }
}

/**
 * Update an escrow contract
 */
export async function updateEscrowContract(
  escrowId: string,
  updates: Partial<Omit<EscrowContract, 'id' | 'createdAt'>>
): Promise<void> {
  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, escrowId);
  
  await updateDoc(transactionRef, {
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
  const transactionRef = doc(db, COLLECTIONS.TRANSACTIONS, escrowId);
  const transactionDoc = await getDoc(transactionRef);

  if (!transactionDoc.exists()) {
    throw new Error('Transaction not found');
  }

  const transaction = transactionDoc.data() as EscrowContract;
  const participantIndex = transaction.participants.findIndex(p => p.userId === userId);

  if (participantIndex === -1) {
    throw new Error('Participant not found in transaction');
  }

  const updatedParticipants = [...transaction.participants];
  updatedParticipants[participantIndex] = {
    ...updatedParticipants[participantIndex],
    keyPoints,
    lastUpdated: Timestamp.now(),
  };

  await updateDoc(transactionRef, {
    participants: updatedParticipants,
    updatedAt: Timestamp.now(),
  });
}
