'use client'

import { Toaster } from 'sonner'
import { useAuth } from './hooks/useAuth'

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-full">
        {children}
      </div>
      <Toaster />
    </>
  )
} 