'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createEscrowContract } from "@/app/utils/firestore"
import { useAuth } from "@/app/hooks/useAuth"
import { toast } from "sonner"
import { EscrowParticipant } from "@/app/types/database"
import { generateEscrowDocument } from "@/app/utils/openai"
import { Timestamp } from "firebase/firestore"

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  value: z.string().min(1, "Value is required"),
  createdAt: z.string().min(1, "Creation date is required"),
  expiresAt: z.string().min(1, "Expiration date is required"),
  keyPoints: z.string().min(1, "Key points are required"),
  party1Email: z.string().optional(),
  party1Role: z.enum(["buyer", "seller"] as const),
  party2Email: z.string().email("Invalid email address"),
  party2Role: z.enum(["buyer", "seller"] as const),
})

export function CreateEscrowDialog() {
  const [open, setOpen] = React.useState(false)
  const [files, setFiles] = React.useState<File[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const { user } = useAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      value: "",
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: "",
      keyPoints: "",
      party1Email: user?.email || "",
      party1Role: "buyer",
      party2Email: "",
      party2Role: "seller",
    },
  })

  React.useEffect(() => {
    if (user?.email) {
      form.setValue('party1Email', user.email)
    }
  }, [user, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      if (!user) {
        toast.error("You must be logged in to create an escrow")
        return
      }

      // Ensure we have valid email addresses
      if (!values.party1Email) {
        toast.error("Your email is required")
        setIsLoading(false)
        return
      }

      if (!values.party2Email) {
        toast.error("Other party email is required")
        setIsLoading(false)
        return
      }

      const keyPoints = values.keyPoints
        .split('\n')
        .map(point => point.trim())
        .filter(point => point.length > 0)

      const party1: EscrowParticipant = {
        userId: user.uid,
        email: values.party1Email || user.email || '', // Ensure it's never undefined
        role: values.party1Role,
        hasApproved: false,
        lastUpdated: new Date(),
        keyPoints: keyPoints,
      }

      const party2: EscrowParticipant = {
        userId: "", // Will be set when they first sign in
        email: values.party2Email, // Validated above
        role: values.party2Role,
        hasApproved: false,
        lastUpdated: new Date(),
        keyPoints: [], // Will be set when they review and approve
      }

      const buyerEmail = values.party1Role === 'buyer' ? values.party1Email : values.party2Email;
      const sellerEmail = values.party1Role === 'seller' ? values.party1Email : values.party2Email;

      // Prepare data for OpenAI with proper type handling
      const openAiData = {
        buyer: (values.party1Role === 'buyer' ? values.party1Email : values.party2Email) as string,
        seller: (values.party1Role === 'seller' ? values.party1Email : values.party2Email) as string,
        amount: parseFloat(values.value.replace(/[^0-9.-]+/g, "")),
        currency: "USD",
        terms: keyPoints,
        conditions: [] as string[],
        releaseConditions: [] as string[],
        disputeResolution: "",
      }

      // Generate documents using OpenAI
      const [summary, contract, legal, deployment] = await Promise.all([
        generateEscrowDocument('summary', openAiData, 'new'),
        generateEscrowDocument('solidity', openAiData, 'new'),
        generateEscrowDocument('pdf_contract', openAiData, 'new'),
        generateEscrowDocument('deployment_script', openAiData, 'new')
      ]);

      // Prepare data for Firestore, including the creatorUserId
      const escrowDataForFirestore = {
        title: values.title,
        amount: parseFloat(values.value.replace(/[^0-9.-]+/g, "")),
        contractAddress: "", // Initially empty
        contractpdf: legal.content,
        current: "pending", // Use 'current' if that's the field name, otherwise maybe 'status'?
        expiresAt: values.expiresAt ? Timestamp.fromDate(new Date(values.expiresAt)) : null, // Convert to Timestamp
        participants: [party1, party2],
        releaseConditions: [] as string[],
        smartContract: contract.content,
        status: "pending" as EscrowContract['status'], // Explicitly cast status to the correct type
        summary: summary.content,
        terms: keyPoints,
        transactionHash: "", // Initially empty
        creatorUserId: user.uid, // Add creator's user ID
      }

      // Call the updated createEscrowContract
      const escrowId = await createEscrowContract(escrowDataForFirestore)

      toast.success("Escrow created successfully")
      setOpen(false)
      form.reset()
      setFiles([])

      // Redirect to the new escrow page
      window.location.href = `/escrow/${escrowId}`
    } catch (error) {
      console.error("Error creating escrow:", error)
      // Provide more specific error feedback if possible
      const errorMessage = error instanceof Error ? error.message : "Failed to create escrow";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Escrow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Escrow</DialogTitle>
          <DialogDescription>
            Fill in the details for the new escrow agreement. All fields are required.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Development Agreement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input placeholder="$100,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="party1Email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="party1Role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Role</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="party2Email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Party Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="partner@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="party2Role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Party Role</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="seller">Seller</option>
                          <option value="buyer">Buyer</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="keyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Points</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter key points (one per line):&#10;1. Milestone-based payments&#10;2. Source code ownership transfer&#10;3. 6-month maintenance period"
                      className="h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>Documents</FormLabel>
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Files
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <div className="text-sm text-muted-foreground">
                  {files.length > 0
                    ? `${files.length} file${files.length === 1 ? '' : 's'} selected`
                    : 'No files selected'}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  'Create Escrow'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 