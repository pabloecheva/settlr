import OpenAI from 'openai';

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

export async function generateEscrowDocument(
  type: DocumentType,
  data: EscrowData
): Promise<string> {
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

    return completion.choices[0]?.message?.content || "No response generated";
  } catch (error) {
    console.error("Error generating document:", error);
    throw error;
  }
}

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