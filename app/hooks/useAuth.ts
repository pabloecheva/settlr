import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from 'firebase/auth'
import { auth } from '@/app/lib/firebase'
import { toast } from 'sonner'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)

      if (!user) {
        // User is signed out
        router.push('/login')
        toast.error('Please sign in to continue')
      }
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [router])

  return { user, loading }
} 