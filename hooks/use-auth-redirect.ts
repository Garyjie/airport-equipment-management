'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStoreContext } from '@/lib/store-context'

export function useAuthRedirect(required: boolean = true) {
  const router = useRouter()
  const { currentUser, isInitialized } = useStoreContext()
  const redirectedRef = useRef(false)

  useEffect(() => {
    if (!isInitialized || redirectedRef.current) return

    if (required && !currentUser) {
      redirectedRef.current = true
      router.replace('/')
    } else if (!required && currentUser) {
      redirectedRef.current = true
      router.replace('/dashboard')
    }
  }, [isInitialized, currentUser, required, router])

  return { isInitialized, currentUser }
}
