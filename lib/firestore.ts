import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { User, Transaction, Contract } from './types';

// Users Collection
export const usersCollection = collection(db, 'users');

export const createUser = async (user: Omit<User, 'id' | 'createdAt'>) => {
  const userRef = doc(usersCollection);
  const newUser: User = {
    ...user,
    id: userRef.id,
    createdAt: new Date()
  };
  await setDoc(userRef, newUser);
  return newUser;
};

export const getUser = async (userId: string) => {
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() as User : null;
};

// Transactions Collection
export const transactionsCollection = collection(db, 'transactions');

export const createTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
  const transactionRef = doc(transactionsCollection);
  const newTransaction: Transaction = {
    ...transaction,
    id: transactionRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await setDoc(transactionRef, newTransaction);
  return newTransaction;
};

export const getTransaction = async (transactionId: string) => {
  const transactionRef = doc(transactionsCollection, transactionId);
  const transactionSnap = await getDoc(transactionRef);
  return transactionSnap.exists() ? transactionSnap.data() as Transaction : null;
};

export const getTransactionsByUser = async (userId: string) => {
  const q = query(
    transactionsCollection,
    where('parties', 'array-contains', { id: userId })
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Transaction);
};

export const updateTransaction = async (transactionId: string, updates: Partial<Transaction>) => {
  const transactionRef = doc(transactionsCollection, transactionId);
  await updateDoc(transactionRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

// Contracts Collection
export const contractsCollection = collection(db, 'contracts');

export const createContract = async (contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>) => {
  const contractRef = doc(contractsCollection);
  const newContract: Contract = {
    ...contract,
    id: contractRef.id,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await setDoc(contractRef, newContract);
  return newContract;
};

export const getContract = async (contractId: string) => {
  const contractRef = doc(contractsCollection, contractId);
  const contractSnap = await getDoc(contractRef);
  return contractSnap.exists() ? contractSnap.data() as Contract : null;
};

export const getContractsByTransaction = async (transactionId: string) => {
  const q = query(
    contractsCollection,
    where('transactionId', '==', transactionId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as Contract);
}; 