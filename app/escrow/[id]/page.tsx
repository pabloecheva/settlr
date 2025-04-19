'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { generateEscrowDocument } from '@/app/utils/openai';
import { EscrowContract } from '@/app/utils/firestore';

interface MissingInfo {
  field: string;
  description: string;
  required: boolean;
}

interface GeneratedDocuments {
  summary?: string;
  contract?: string;
  legal?: string;
  deployment?: string;
}

export default function EscrowDetailsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [signature, setSignature] = useState('');
  const [documents, setDocuments] = useState<GeneratedDocuments>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [missingInfo] = useState<MissingInfo[]>([
    {
      field: 'disputeResolutionTimeframe',
      description: 'How long should parties wait before initiating dispute resolution?',
      required: true
    },
    {
      field: 'arbitrator',
      description: 'Who will serve as the arbitrator in case of disputes?',
      required: true
    },
    {
      field: 'cancelationFee',
      description: 'What percentage fee will be charged for early cancellation?',
      required: false
    }
  ]);

  useEffect(() => {
    async function fetchEscrowData() {
      try {
        const escrowRef = doc(db, 'escrows', params.id);
        const escrowDoc = await getDoc(escrowRef);
        
        if (!escrowDoc.exists()) {
          console.error('Escrow not found');
          return;
        }

        const escrowData = escrowDoc.data() as EscrowContract;
        
        // Transform the data into the format expected by OpenAI
        const openAiData = {
          buyer: escrowData.participants.find(p => p.role === 'buyer')?.email || '',
          seller: escrowData.participants.find(p => p.role === 'seller')?.email || '',
          amount: escrowData.amount,
          currency: 'USD', // Default to USD for now
          terms: escrowData.terms || [],
          conditions: [], // Add conditions if needed
          releaseConditions: escrowData.releaseConditions || [],
          disputeResolution: '', // Add dispute resolution if needed
        };
        
        // Generate documents using OpenAI
        const [summary, contract, legal, deployment] = await Promise.all([
          generateEscrowDocument('summary', openAiData, params.id),
          generateEscrowDocument('solidity', openAiData, params.id),
          generateEscrowDocument('pdf_contract', openAiData, params.id),
          generateEscrowDocument('deployment_script', openAiData, params.id)
        ]);

        setDocuments({
          summary: summary.content,
          contract: contract.content,
          legal: legal.content,
          deployment: deployment.content
        });
      } catch (error) {
        console.error('Error fetching escrow data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEscrowData();
  }, [params.id]);

  const handleDeploy = async () => {
    // This will handle deployment and signing
    console.log('Deploying contract...');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Escrow Details</h1>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Tabs defaultValue="summary" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="contract">Smart Contract</TabsTrigger>
              <TabsTrigger value="legal">Legal Document</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Deal Summary</h2>
                <div className="prose">
                  {documents.summary ? (
                    <div dangerouslySetInnerHTML={{ __html: documents.summary }} />
                  ) : (
                    <p>Loading summary from OpenAI...</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="contract" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Smart Contract Code</h2>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>
                    {documents.contract || "Loading Solidity contract from OpenAI..."}
                  </code>
                </pre>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Legal Documentation</h2>
                <div className="prose">
                  {documents.legal ? (
                    <div dangerouslySetInnerHTML={{ __html: documents.legal }} />
                  ) : (
                    <p>Loading legal document from OpenAI...</p>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="deployment" className="mt-6">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Deployment Script</h2>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                  <code>
                    {documents.deployment || "Loading deployment script from OpenAI..."}
                  </code>
                </pre>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          {/* Missing Information Panel */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Required Information</h2>
            <div className="space-y-4">
              {missingInfo.map((info, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={info.field}>
                    {info.description}
                    {info.required && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id={info.field}
                    placeholder={`Enter ${info.field}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Signature Panel */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Digital Signature</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signature">Your Signature</Label>
                <Textarea
                  id="signature"
                  placeholder="Type your full legal name to sign"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Deploy & Sign Button */}
          <Button 
            className="w-full py-6 text-lg"
            onClick={handleDeploy}
            disabled={!signature || missingInfo.some(info => info.required && !info.field)}
          >
            Deploy & Sign Contract
          </Button>
        </div>
      </div>
    </div>
  );
} 