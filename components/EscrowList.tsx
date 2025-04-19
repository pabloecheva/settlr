'use client'

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreVertical, ChevronRight, FileText } from "lucide-react"

interface Party {
  name: string
  role: string
}

interface Escrow {
  id: string
  title: string
  parties: Party[]
  value: string
  status: 'pending' | 'active' | 'completed' | 'expired'
  createdAt: string
  expiresAt: string
  keyPoints: string[]
  documents: number
}

const mockEscrows: Escrow[] = [
  {
    id: "ESC-001",
    title: "Software Development Agreement",
    parties: [
      { name: "TechCorp Solutions Inc.", role: "Client" },
      { name: "Global Software Services Ltd.", role: "Developer" }
    ],
    value: "$125,000",
    status: "active",
    createdAt: "2024-03-15",
    expiresAt: "2024-09-15",
    keyPoints: [
      "Milestone-based payments",
      "Source code ownership transfer",
      "6-month maintenance period"
    ],
    documents: 3
  },
  {
    id: "ESC-002",
    title: "Manufacturing Contract",
    parties: [
      { name: "Innovative Systems LLC", role: "Buyer" },
      { name: "Digital Solutions Group", role: "Manufacturer" }
    ],
    value: "$87,500",
    status: "pending",
    createdAt: "2024-03-14",
    expiresAt: "2024-06-14",
    keyPoints: [
      "Quality assurance requirements",
      "Delivery schedule",
      "Payment terms"
    ],
    documents: 2
  },
  {
    id: "ESC-003",
    title: "Data Processing Agreement",
    parties: [
      { name: "DataFlow Analytics", role: "Processor" },
      { name: "Cloud Infrastructure Partners", role: "Controller" }
    ],
    value: "$250,000",
    status: "completed",
    createdAt: "2024-03-13",
    expiresAt: "2025-03-13",
    keyPoints: [
      "GDPR compliance",
      "Data security measures",
      "Processing limitations"
    ],
    documents: 4
  }
]

const getStatusColor = (status: Escrow['status']) => {
  switch (status) {
    case 'active':
      return 'bg-success text-success-foreground hover:bg-success/90'
    case 'pending':
      return 'bg-warning text-warning-foreground hover:bg-warning/90'
    case 'completed':
      return 'bg-primary text-primary-foreground hover:bg-primary/90'
    case 'expired':
      return 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    default:
      return 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
  }
}

export function EscrowList() {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Title & Parties</TableHead>
            <TableHead>Key Points</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockEscrows.map((escrow) => (
            <TableRow key={escrow.id} className="group">
              <TableCell>
                <div>
                  <div className="font-medium">{escrow.title}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {escrow.parties.map((party, index) => (
                      <div key={party.name}>
                        {party.role}: {party.name}
                      </div>
                    ))}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <ul className="list-disc pl-4 text-sm text-muted-foreground">
                  {escrow.keyPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </TableCell>
              <TableCell className="font-medium">{escrow.value}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(escrow.status)}>
                  {escrow.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(escrow.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(escrow.expiresAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100">
                  <Button variant="ghost" size="icon" className="relative">
                    <FileText className="h-4 w-4" />
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                      {escrow.documents}
                    </span>
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 