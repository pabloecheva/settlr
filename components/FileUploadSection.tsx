import * as React from "react"
import { FileUpload } from "@/components/ui/file-upload"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, FileText, Send } from "lucide-react"
import { formatFileSize, readFileAsText } from "@/lib/utils"

interface UploadedFile {
  file: File
  content?: string
}

export function FileUploadSection() {
  const [files, setFiles] = React.useState<UploadedFile[]>([])
  const [prompt, setPrompt] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleFilesSelected = async (fileList: FileList) => {
    const newFiles = Array.from(fileList).map(file => ({ file }))
    setFiles(prev => [...prev, ...newFiles])

    // Read content of text files
    for (const fileData of newFiles) {
      if (fileData.file.type.includes('text') || 
          fileData.file.name.endsWith('.txt') || 
          fileData.file.name.endsWith('.md')) {
        try {
          const content = await readFileAsText(fileData.file)
          setFiles(prev => 
            prev.map(f => 
              f.file === fileData.file ? { ...f, content } : f
            )
          )
        } catch (error) {
          console.error(`Error reading file ${fileData.file.name}:`, error)
        }
      }
    }
  }

  const removeFile = (fileToRemove: File) => {
    setFiles(prev => prev.filter(f => f.file !== fileToRemove))
  }

  const handlePromptSubmit = async () => {
    if (!prompt.trim() || files.length === 0) return

    setIsLoading(true)
    try {
      // Here you would integrate with your AI service
      console.log("Submitting prompt with files:", {
        prompt,
        files: files.map(f => ({
          name: f.file.name,
          type: f.file.type,
          size: f.file.size
        }))
      })
    } catch (error) {
      console.error("Error processing files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-card">
      <div className="border-b p-6">
        <div className="section-header">
          <div>
            <h2 className="section-title">Document Analysis</h2>
            <p className="text-sm text-muted-foreground">
              Upload documents to analyze with AI
            </p>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <FileUpload
          onFilesSelected={handleFilesSelected}
          accept=".txt,.pdf,.doc,.docx,.md"
          maxSize={20}
        />

        {files.length > 0 && (
          <div className="space-y-4">
            <div className="grid gap-2">
              {files.map(({ file }) => (
                <div
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between p-3 border rounded-lg bg-muted/5"
                >
                  <div className="flex items-center space-x-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFile(file)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Enter your prompt for the AI..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <Button
                className="w-full"
                onClick={handlePromptSubmit}
                disabled={isLoading || !prompt.trim() || files.length === 0}
              >
                {isLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Analyze Documents
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
} 