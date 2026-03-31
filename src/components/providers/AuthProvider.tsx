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
 * Call from sign-up/sign-in pages to prevent the AuthProvider from
 * creating a session cookie (the page handles it explicitly).
 * Stays set until the page navigates away.
 */
export function markSessionHandled() {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).__sessionHandled = true
  }
}

function isSessionHandled(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window as unknown as Record<string, unknown>).__sessionHandled
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
        if (!isSessionHandled()) {
          const idToken = await firebaseUser.getIdToken()
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          })
        }
        // Don't reset the flag here — let page navigation clear it
      } else {
        setUser(null)
        setRole(null)
        if (!isSessionHandled()) {
          await fetch('/api/auth/session', { method: 'DELETE' })
        }
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  async function signOut() {
    await firebaseSignOut(getClientAuth())
    await fetch('/api/auth/session', { method: 'DELETE' })
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
