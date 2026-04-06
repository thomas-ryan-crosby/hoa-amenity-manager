'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type Community = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
}

function JoinContent() {
  const searchParams = useSearchParams()
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/communities/list')
      .then((r) => r.json())
      .then((d) => {
        setCommunities(d.communities ?? [])
        // Auto-select if only one community
        if (d.communities?.length === 1) {
          setSelectedId(d.communities[0].id)
        }
      })
      .finally(() => setFetching(false))
  }, [])

  // Support invite code from URL as fallback
  const inviteCode = searchParams.get('code')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId && !inviteCode) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const body: Record<string, string> = {}
      if (selectedId) body.communityId = selectedId
      else if (inviteCode) body.code = inviteCode

      const res = await fetch('/api/communities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unable to join')

      setSuccess(`Joined ${data.communityName}! Your request is pending approval.`)

      // Set active community
      await fetch('/api/communities/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId: data.communityId }),
      })

      // Redirect after a moment
      setTimeout(() => { window.location.href = '/resident' }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="h-64 w-80 animate-pulse rounded-3xl bg-stone-100" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Join a community</h1>
        <p className="mt-2 text-sm text-stone-500">
          Select your community to request access. A property manager will review your request.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleJoin}>
          <label className="block text-sm font-medium text-stone-700">
            Community
            <select
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-emerald-500"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              required
            >
              <option value="">Select a community...</option>
              {communities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.city && c.state ? ` — ${c.city}, ${c.state}` : ''}
                </option>
              ))}
            </select>
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <button
            className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
            type="submit"
            disabled={loading || (!selectedId && !inviteCode)}
          >
            {loading ? 'Joining...' : 'Request to join'}
          </button>
        </form>

        {communities.length === 0 && (
          <p className="mt-4 text-center text-sm text-stone-400">
            No communities available yet. Contact your property manager.
          </p>
        )}
      </div>
    </main>
  )
}

export default function JoinCommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <JoinContent />
    </Suspense>
  )
}
