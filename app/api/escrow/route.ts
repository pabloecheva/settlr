import { NextResponse } from 'next/server';
import { generateEscrowDocument, DocumentType, EscrowData } from '@/app/utils/openai';

export async function POST(request: Request) {
  try {
    const { type, data } = await request.json();

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    const document = await generateEscrowDocument(type as DocumentType, data as EscrowData);
    
    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error in escrow API:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
} 