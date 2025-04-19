'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { onAuthStateChange } from '@/app/utils/firebase-auth'
import type { User } from 'firebase/auth'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user: User | null) => {
      if (user) {
        // If user is logged in, redirect to dashboard
        router.push('/dashboard')
      } else {
        // If no user is logged in, redirect to login page
        router.push('/login')
      }
    })

    return () => unsubscribe()
  }, [router])

  // Show loading state while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}
