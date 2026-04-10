'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Community = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  zip: string | null
}

function JoinContent() {
  const searchParams = useSearchParams()
  const inviteCode = searchParams.get('code')

  const [zip, setZip] = useState('')
  const [communities, setCommunities] = useState<Community[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!zip.trim()) return
    setSearching(true)
    setError('')
    setCommunities([])
    setSelectedId('')
    setSearched(false)
    try {
      const res = await fetch(`/api/communities/list?zip=${encodeURIComponent(zip.trim())}`)
      const data = await res.json()
      setCommunities(data.communities ?? [])
      setSearched(true)
      if (data.communities?.length === 1) {
        setSelectedId(data.communities[0].id)
      }
    } catch {
      setError('Unable to search. Please try again.')
    } finally {
      setSearching(false)
    }
  }

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

      await fetch('/api/communities/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId: data.communityId }),
      })

      setTimeout(() => { window.location.href = '/resident' }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Join a community</h1>
        <p className="mt-2 text-sm text-stone-500">
          Enter your zip code to find your community.
        </p>

        {/* Zip code search */}
        <form className="mt-6" onSubmit={handleSearch}>
          <label className="block text-sm font-medium text-stone-700">
            Zip code
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-emerald-500"
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter zip code"
                value={zip}
                onChange={(e) => { setZip(e.target.value.replace(/\D/g, '')); setSearched(false) }}
                required
              />
              <button
                type="submit"
                disabled={searching || zip.length < 3}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </label>
        </form>

        {/* Results */}
        {searched && communities.length > 0 && (
          <form className="mt-5 space-y-4" onSubmit={handleJoin}>
            <p className="text-sm text-stone-600">
              {communities.length} {communities.length === 1 ? 'community' : 'communities'} found:
            </p>
            <div className="space-y-2">
              {communities.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer transition ${
                    selectedId === c.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="community"
                    value={c.id}
                    checked={selectedId === c.id}
                    onChange={() => setSelectedId(c.id)}
                    className="accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-stone-900">{c.name}</p>
                    {c.city && c.state && (
                      <p className="text-xs text-stone-500">{c.city}, {c.state} {c.zip}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>
            )}

            <button
              className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
              type="submit"
              disabled={loading || !selectedId}
            >
              {loading ? 'Joining...' : 'Request to join'}
            </button>
          </form>
        )}

        {/* No results */}
        {searched && communities.length === 0 && (
          <div className="mt-5">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            ) : (
              <p className="text-sm text-stone-500">No communities found near that zip code.</p>
            )}
          </div>
        )}

        {/* Onboard CTA */}
        {searched && (
          <div className="mt-6 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5 text-center">
            <p className="text-sm font-medium text-stone-700">Don't see your community?</p>
            <p className="mt-1 text-xs text-stone-500">
              Set up your HOA on Neighbri and start managing amenity bookings today.
            </p>
            <Link
              href="/onboard"
              className="mt-3 inline-block rounded-full bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
            >
              Onboard your community
            </Link>
          </div>
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
