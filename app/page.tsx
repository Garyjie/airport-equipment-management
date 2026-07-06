'use client'

import { useAuthRedirect } from '@/hooks/use-auth-redirect'
import { LoginForm } from '@/components/auth/login-form'
import { Loader2 } from 'lucide-react'

export default function HomePage() {
  const { isInitialized, currentUser } = useAuthRedirect(false)

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
