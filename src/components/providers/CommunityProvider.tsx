'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthProvider'

type CommunityInfo = {
  id: string
  name: string
  slug: string
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
  const { user } = useAuth()
  const [communities, setCommunities] = useState<CommunityInfo[]>([])
  const [activeCommunity, setActiveCommunity] = useState<CommunityInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
  }, [user])

  async function switchCommunity(communityId: string) {
    await fetch('/api/communities/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communityId }),
    })
    const target = communities.find((c) => c.id === communityId)
    setActiveCommunity(target ?? null)
    // Reload to apply new community context
    window.location.reload()
  }

  return (
    <CommunityContext.Provider value={{ activeCommunity, communities, switchCommunity, loading }}>
      {children}
    </CommunityContext.Provider>
  )
}
