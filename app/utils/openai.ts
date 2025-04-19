import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { COLLECTIONS } from '@/app/types/database';

export type DocumentType = 'pdf_contract' | 'summary' | 'solidity' | 'deployment_script';

export interface EscrowData {
  buyer: string;
  seller: string;
  amount: number;
  currency: string;
  terms: string[];
  conditions: string[];
  releaseConditions: string[];
  disputeResolution: string;
  // Add more fields as needed
}

export interface GeneratedDocument {
  id?: string;
  type: DocumentType;
  content: string;
  dealId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function generateEscrowDocument(
  type: DocumentType,
  data: EscrowData,
  dealId: string
): Promise<GeneratedDocument> {
  try {
    // Use the API route instead of direct OpenAI call
    const response = await fetch('/api/generate-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
        dealId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate document');
    }

    const result = await response.json();
    
    // Convert string dates back to Date objects
    return {
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt)
    };
  } catch (error) {
    console.error("Error generating document:", error);
    throw error;
  }
}

// Document operations
export const documentStore = {
  // Get documents by deal ID
  async getDocumentsByDealId(dealId: string): Promise<GeneratedDocument[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.CONTRACTS),
        where('dealId', '==', dealId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GeneratedDocument[];
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  }
}; 