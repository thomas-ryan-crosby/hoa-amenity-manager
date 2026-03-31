'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import { getClientAuth } from '@/lib/firebase/client'

type AuthContextType = {
  user: User | null
  role: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

/**
 * Call this from sign-up/sign-in pages BEFORE the AuthProvider fires,
 * so the provider knows a session is already being handled.
 */
export function markSessionHandled() {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__sessionHandled = true
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)

        const tokenResult = await firebaseUser.getIdTokenResult()
        setRole((tokenResult.claims.role as string) ?? null)

        // Only create session if the page didn't already handle it
        const alreadyHandled = (window as unknown as Record<string, unknown>).__sessionHandled
        if (!alreadyHandled) {
          const idToken = await firebaseUser.getIdToken()
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })
        }
        // Reset for next auth state change
        ;(window as unknown as Record<string, unknown>).__sessionHandled = false
      } else {
        setUser(null)
        setRole(null)
        await fetch('/api/auth/session', { method: 'DELETE' })
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  async function signOut() {
    await firebaseSignOut(getClientAuth())
    await fetch('/api/auth/session', { method: 'DELETE' })
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
