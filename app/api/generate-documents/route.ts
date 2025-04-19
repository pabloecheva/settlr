import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/app/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/app/types/database';

// OpenAI client is initialized server-side only
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, dealId } = body;
    
    if (!type || !data || !dealId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, data, or dealId' },
        { status: 400 }
      );
    }

    const systemPrompt = getSystemPrompt(type);
    const userPrompt = formatUserPrompt(data);

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "gpt-4-0125-preview",
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content || "No response generated";
    
    try {
      // Save the generated document to Firestore
      const docRef = await addDoc(collection(db, COLLECTIONS.CONTRACTS), {
        type,
        content,
        dealId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      return NextResponse.json({
        id: docRef.id,
        type,
        content,
        dealId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (firestoreError) {
      console.error("Error saving to Firestore:", firestoreError);
      // Return the document without Firestore ID if saving fails
      return NextResponse.json({
        type,
        content,
        dealId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}

function getSystemPrompt(type: DocumentType): string {
  switch (type) {
    case 'pdf_contract':
      return `You are a legal expert specializing in escrow agreements. Generate a comprehensive PDF contract that includes all necessary legal clauses, terms, and conditions for an escrow transaction. The contract should be professional, legally binding, and cover all standard escrow requirements.`;
    case 'summary':
      return `You are a financial analyst creating a clear, visually appealing summary of an escrow transaction. Format your response in the following structure:

📊 ESCROW SUMMARY
----------------
🤝 Participants
- Buyer: [buyer email]
- Seller: [seller email]

💰 Transaction Details
- Amount: [amount with currency]
- Status: Pending

📝 Key Terms
[List key terms as bullet points with emojis]

⏰ Important Dates
- Created: [current date]
- Expires: [expiration date]

Keep the format clean and easy to read, using emojis and clear sections to improve readability.`;
    case 'solidity':
      return `You are a blockchain developer creating a secure Solidity smart contract for an escrow transaction. Generate a complete, production-ready smart contract with the following requirements:

1. Use the latest stable Solidity version (^0.8.0)
2. Include comprehensive NatSpec documentation
3. Follow all security best practices
4. Implement the following features:
   - Deposit funds into escrow
   - Release funds to seller
   - Refund to buyer if conditions aren't met
   - Dispute resolution mechanism
   - Automatic expiration handling
   - Emergency pause functionality
   - Fee handling

Structure your code with clear sections and detailed comments explaining:
- Contract overview and purpose
- State variables and their roles
- Function purposes and security considerations
- Event emissions
- Access control
- Security measures
- Gas optimization techniques

Example structure:
// SPDX-License-Identifier
pragma solidity ^0.8.0;

/// @title Escrow Contract
/// @author Settlr Platform
/// @notice [Contract purpose]
/// @dev [Technical details]

[Your code with detailed comments]`;
    case 'deployment_script':
      return `You are a blockchain deployment expert. Create a deployment script for the escrow smart contract. Include all necessary steps, environment setup, and deployment commands.`;
    default:
      return `You are a document generation expert. Create a professional document based on the provided escrow details.`;
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