'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function JoinContent() {
  const searchParams = useSearchParams()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [communityName, setCommunityName] = useState<string | null>(null)
  const router = useRouter()

  // Auto-fill code from query param
  useEffect(() => {
    const qCode = searchParams.get('code')
    if (qCode) setCode(qCode)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setCommunityName(null)
    try {
      const res = await fetch('/api/communities/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unable to join')

      setCommunityName(data.communityName)

      // Set active community and redirect
      await fetch('/api/communities/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communityId: data.communityId }),
      })

      window.location.href = '/resident'
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
          Enter the invite code from your property manager to join your community.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-stone-700">
            Invite code
            <input
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 uppercase tracking-widest text-center text-lg font-mono outline-none focus:border-emerald-500"
              type="text"
              placeholder="e.g. ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </label>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {communityName && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Joined <strong>{communityName}</strong>! Redirecting...
            </div>
          )}

          <button
            className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
            type="submit"
            disabled={loading || !code.trim()}
          >
            {loading ? 'Joining...' : 'Join community'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-stone-400">
          Don&apos;t have a code? Ask your property manager for an invite link.
        </p>
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
