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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getClientAuth(), async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        // Get custom claims for role
        const tokenResult = await firebaseUser.getIdTokenResult()
        setRole((tokenResult.claims.role as string) ?? null)
        // Create session cookie
        const idToken = await firebaseUser.getIdToken()
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })
      } else {
        setUser(null)
        setRole(null)
        // Clear session cookie
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
