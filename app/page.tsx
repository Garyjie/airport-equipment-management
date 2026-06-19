'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'
import { LoginForm } from '@/components/auth/login-form'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { currentUser, isInitialized } = useStoreContext()

  useEffect(() => {
    if (isInitialized && currentUser) {
      router.push('/dashboard')
    }
  }, [isInitialized, currentUser, router])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (currentUser) {
    return null
  }

  return <LoginForm />
}
