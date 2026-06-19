'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useStore, type Store } from './store'

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStore()
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStoreContext() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStoreContext must be used within a StoreProvider')
  }
  return context
}
