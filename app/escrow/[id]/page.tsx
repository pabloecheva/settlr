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
import { COLLECTIONS } from '@/app/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/app/hooks/useAuth';

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [signature, setSignature] = useState('');
  const [documents, setDocuments] = useState<GeneratedDocuments>({});
  const [isLoading, setIsLoading] = useState(true);
  const [escrowData, setEscrowData] = useState<EscrowContract | null>(null);
  
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
    async function fetchTransactionData() {
      if (!user?.uid) {
        toast.error("User not authenticated.");
        setIsLoading(false);
        return;
      }
      
      if (!params.id) {
        toast.error("Transaction ID missing.");
        setIsLoading(false);
        return;
      }

      console.log(`Fetching transaction ${params.id} for user ${user.uid}`);

      try {
        const transactionRef = doc(
          db,
          COLLECTIONS.USERS,
          user.uid,
          COLLECTIONS.TRANSACTIONS,
          params.id
        );
        
        const transactionDoc = await getDoc(transactionRef);
        
        if (!transactionDoc.exists()) {
          console.error('Escrow transaction document not found at path:', transactionRef.path);
          toast.error('Escrow transaction not found.');
          setIsLoading(false);
          return;
        }

        const data = transactionDoc.data() as EscrowContract;
        setEscrowData(data);
        console.log("Fetched escrow data:", data);

        setDocuments({
          summary: data.summary || '',
          contract: data.smartContract || '',
          legal: data.contractpdf || '',
          deployment: '',
        });

      } catch (error) {
        console.error('Error fetching escrow data:', error);
        toast.error('Error fetching escrow data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactionData();
  }, [params.id, user?.uid]);

  const handleDeploy = async () => {
    toast.info('Preparing to deploy contract...');
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
      <h1 className="text-2xl font-bold mb-6">
        {escrowData?.title || 'Escrow Details'}
      </h1>
      
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
                <div className="whitespace-pre-wrap">
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
                <div className="whitespace-pre-wrap">
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

          <Button 
            className="w-full py-6 text-lg"
            onClick={handleDeploy}
          >
            Deploy & Sign Contract
          </Button>
        </div>
      </div>
    </div>
  );
} 