'use client'

import { useState } from 'react'
import Link from 'next/link'

type BrowseCommunity = {
  slug: string
  name: string
  city: string | null
  state: string | null
  zip: string | null
  amenityCount: number
  amenities: string[]
}

export default function BrowsePage() {
  const [zip, setZip] = useState('')
  const [communities, setCommunities] = useState<BrowseCommunity[]>([])
  const [searched, setSearched] = useState(false)
  const [searching, setSearching] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!zip.trim()) return
    setSearching(true)
    setCommunities([])
    setSearched(false)
    try {
      const res = await fetch(`/api/browse?zip=${encodeURIComponent(zip.trim())}`)
      const data = await res.json()
      setCommunities(data.communities ?? [])
      setSearched(true)
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/get-started" className="text-sm text-emerald-700 hover:text-emerald-900">&larr; Back</Link>

        <div className="mt-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">Browse amenities near you</h1>
          <p className="mt-2 text-sm text-stone-500">
            Find pools, courts, clubhouses, and event spaces open to guests in your area.
          </p>
        </div>

        <form className="mt-8" onSubmit={handleSearch}>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-emerald-500"
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Enter your zip code"
              value={zip}
              onChange={(e) => { setZip(e.target.value.replace(/\D/g, '')); setSearched(false) }}
              required
            />
            <button
              type="submit"
              disabled={searching || zip.length < 5}
              className="rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {searched && communities.length > 0 && (
          <div className="mt-8 space-y-4">
            <p className="text-sm text-stone-600">
              {communities.length} {communities.length === 1 ? 'community' : 'communities'} with guest amenities:
            </p>
            {communities.map((c) => (
              <Link
                key={c.slug}
                href={`/book/${c.slug}`}
                className="block rounded-2xl border border-stone-200 bg-white p-5 hover:border-emerald-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">{c.name}</h3>
                    {c.city && c.state && (
                      <p className="mt-0.5 text-sm text-stone-500">{c.city}, {c.state} {c.zip}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {c.amenities.map((name) => (
                        <span key={name} className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs text-emerald-700">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-emerald-600">{c.amenityCount} amenities &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {searched && communities.length === 0 && (
          <div className="mt-8 text-center">
            <p className="text-sm text-stone-500">No communities with guest amenities found near that zip code.</p>
            <p className="mt-2 text-xs text-stone-400">Try a different zip code or check back later as more communities join Neighbri.</p>
          </div>
        )}
      </div>
    </main>
  )
}
