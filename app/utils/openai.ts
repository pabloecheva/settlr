import OpenAI from 'openai';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

export const COLLECTIONS = {
  CONTRACTS: 'contracts',
  ESCROWS: 'escrows',
  USERS: 'users'
} as const;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const systemPrompt = getSystemPrompt(type);
    const userPrompt = formatUserPrompt(data);

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "gpt-4.1",
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "No response generated";
    
    try {
      // Save the generated document to Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.CONTRACTS), {
        type,
        content,
        dealId,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return {
        id: docRef.id,
        type,
        content,
        dealId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (firestoreError) {
      console.error("Error saving to Firestore:", firestoreError);
      // Return the document without Firestore ID if saving fails
      return {
        type,
        content,
        dealId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
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

function getSystemPrompt(type: DocumentType): string {
  switch (type) {
    case 'pdf_contract':
      return `You are a legal expert specializing in escrow agreements. Generate a comprehensive PDF contract that includes all necessary legal clauses, terms, and conditions for an escrow transaction. The contract should be professional, legally binding, and cover all standard escrow requirements.`;
    case 'summary':
      return `You are a financial analyst. Create a concise summary of the escrow transaction highlighting key statistics, important dates, and critical terms. Format the summary in a clear, bullet-point style.`;
    case 'solidity':
      return `You are a blockchain developer. Write a Solidity smart contract for an escrow transaction. Include all necessary functions for depositing funds, releasing funds, and handling disputes. Ensure the contract is secure and follows best practices.`;
    case 'deployment_script':
      return `You are a blockchain deployment expert. Create a deployment script for the escrow smart contract. Include all necessary steps, environment setup, and deployment commands.`;
  }
}

function formatUserPrompt(data: EscrowData): string {
  return `
    Generate a document with the following escrow details:
    - Buyer: ${data.buyer}
    - Seller: ${data.seller}
    - Amount: ${data.amount} ${data.currency}
    - Terms: ${data.terms.join(', ')}
    - Conditions: ${data.conditions.join(', ')}
    - Release Conditions: ${data.releaseConditions.join(', ')}
    - Dispute Resolution: ${data.disputeResolution}
  `;
} 