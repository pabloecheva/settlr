import * as React from "react"
import { UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onFilesSelected: (files: FileList) => void
  className?: string
  maxSize?: number // in MB
  accept?: string
}

export function FileUpload({
  onFilesSelected,
  className,
  maxSize = 10, // Default max size 10MB
  accept = ".pdf,.doc,.docx,.txt",
  ...props
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files) {
      const files = e.dataTransfer.files
      validateAndProcessFiles(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndProcessFiles(e.target.files)
    }
  }

  const validateAndProcessFiles = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxSize}MB`)
        return false
      }
      
      // Check file type if accept is specified
      if (accept && !accept.split(',').some(type => 
        file.name.toLowerCase().endsWith(type.trim()) ||
        file.type.match(new RegExp(type.trim().replace('*', '.*').replace('.', '\\.'))))) {
        alert(`File ${file.name} is not an accepted file type`)
        return false
      }
      
      return true
    })

    if (validFiles.length > 0) {
      onFilesSelected(files)
    }
  }

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100",
        isDragging && "border-primary bg-primary/5",
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInput}
        multiple
        accept={accept}
        {...props}
      />
      <UploadCloud className="w-12 h-12 mb-4 text-gray-400" />
      <p className="mb-2 text-sm text-gray-500">
        <span className="font-semibold">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-500">
        {accept ? `Accepted file types: ${accept}` : 'All files are allowed'} (Max: {maxSize}MB)
      </p>
    </div>
  )
} 