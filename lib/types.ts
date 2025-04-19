export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface Transaction {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'signed' | 'deployed' | 'expired';
  parties: {
    id: string;
    email: string;
    name: string;
    signed: boolean;
    signatureDate?: Date;
  }[];
  dealFiles: {
    name: string;
    url: string;
    uploadedBy: string;
    uploadedAt: Date;
  }[];
  smartContract: {
    code: string;
    deploymentScript: string;
    deployedAddress?: string;
    deployedAt?: Date;
  };
  expirationDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Contract {
  id: string;
  transactionId: string;
  code: string;
  deploymentScript: string;
  status: 'generated' | 'deployed' | 'failed';
  deployedAddress?: string;
  deployedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
} 