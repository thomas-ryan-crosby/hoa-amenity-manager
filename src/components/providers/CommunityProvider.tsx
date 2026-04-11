'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthProvider'

type CommunityInfo = {
  id: string
  name: string
  slug: string
  timezone: string
  role: string
  status: string
}

type CommunityContextType = {
  activeCommunity: CommunityInfo | null
  communities: CommunityInfo[]
  switchCommunity: (communityId: string) => Promise<void>
  loading: boolean
}

const CommunityContext = createContext<CommunityContextType>({
  activeCommunity: null,
  communities: [],
  switchCommunity: async () => {},
  loading: true,
})

export function useCommunity() {
  return useContext(CommunityContext)
}

export function CommunityProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [communities, setCommunities] = useState<CommunityInfo[]>([])
  const [activeCommunity, setActiveCommunity] = useState<CommunityInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Don't resolve community loading until auth is done
    if (authLoading) return
    if (!user) { setCommunities([]); setActiveCommunity(null); setLoading(false); return }

    async function loadCommunities() {
      try {
        const res = await fetch('/api/communities')
        const data = await res.json()
        const list = data.communities ?? []
        setCommunities(list)

        // Check for active community in cookie
        const activeId = data.activeCommunityId
        const active = list.find((c: CommunityInfo) => c.id === activeId) ?? list[0] ?? null
        setActiveCommunity(active)

        // If no cookie is set but we have a community, set the cookie
        // so server-side API routes can read the active community
        if (!activeId && active) {
          await fetch('/api/communities/switch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ communityId: active.id }),
          })
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadCommunities()
  }, [user, authLoading])

  async function switchCommunity(communityId: string) {
    // Set active community in state immediately so the spinner shows the right name
    const target = communities.find((c) => c.id === communityId)
    setActiveCommunity(target ?? null)

    // Set the cookie server-side, then reload to refetch all page data
    // The branded spinner in PendingGate covers the reload cleanly
    await fetch('/api/communities/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communityId }),
    })

    window.location.reload()
  }

  return (
    <CommunityContext.Provider value={{ activeCommunity, communities, switchCommunity, loading }}>
      {children}
    </CommunityContext.Provider>
  )
}
