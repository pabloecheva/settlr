'use client';

import { useState } from 'react';
import { DocumentType, EscrowData } from '@/app/utils/openai';

export default function ChatInterface() {
  const [escrowData, setEscrowData] = useState<EscrowData>({
    buyer: '',
    seller: '',
    amount: 0,
    currency: 'USD',
    terms: [],
    conditions: [],
    releaseConditions: [],
    disputeResolution: '',
  });
  const [documentType, setDocumentType] = useState<DocumentType>('pdf_contract');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/escrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: documentType,
          data: escrowData,
        }),
      });

      const data = await res.json();
      setResponse(data.document);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error occurred while generating document');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Buyer</label>
            <input
              type="text"
              value={escrowData.buyer}
              onChange={(e) => setEscrowData({ ...escrowData, buyer: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seller</label>
            <input
              type="text"
              value={escrowData.seller}
              onChange={(e) => setEscrowData({ ...escrowData, seller: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Amount</label>
            <input
              type="number"
              value={escrowData.amount}
              onChange={(e) => setEscrowData({ ...escrowData, amount: Number(e.target.value) })}
              className="w-full p-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Currency</label>
            <input
              type="text"
              value={escrowData.currency}
              onChange={(e) => setEscrowData({ ...escrowData, currency: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Document Type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as DocumentType)}
            className="w-full p-2 border rounded-md"
          >
            <option value="pdf_contract">PDF Contract</option>
            <option value="summary">Summary</option>
            <option value="solidity">Solidity Contract</option>
            <option value="deployment_script">Deployment Script</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? 'Generating...' : 'Generate Document'}
        </button>
      </form>
      
      {response && (
        <div className="mt-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-bold mb-2">Generated Document:</h3>
          <pre className="whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
} 