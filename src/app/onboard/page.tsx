'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'

const TZ_LABELS: Record<string, string> = {
  'America/New_York': 'Eastern',
  'America/Chicago': 'Central',
  'America/Denver': 'Mountain',
  'America/Los_Angeles': 'Pacific',
  'America/Anchorage': 'Alaska',
  'Pacific/Honolulu': 'Hawaii',
}

export default function OnboardPage() {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [timezone, setTimezone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)

  const lookupZip = useCallback(async (zipCode: string) => {
    if (zipCode.length < 5) return
    setLookingUp(true)
    try {
      const res = await fetch(`/api/lookup/zip?zip=${zipCode}`)
      if (res.ok) {
        const data = await res.json()
        setCity(data.city ?? '')
        setState(data.state ?? '')
        setTimezone(data.timezone ?? 'America/Chicago')
        setLookupDone(true)
      }
    } catch {
      // Ignore — user can fill manually
    } finally {
      setLookingUp(false)
    }
  }, [])

  function handleZipChange(value: string) {
    const clean = value.replace(/\D/g, '').slice(0, 5)
    setZip(clean)
    setLookupDone(false)
    if (clean.length === 5) {
      lookupZip(clean)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, address, city, state, zip,
          timezone: timezone || 'America/Chicago',
          plan: 'standard',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unable to create community')

      window.location.href = '/admin/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">Set up your community</h1>
          <p className="mt-2 text-sm text-stone-500">
            Tell us about your community. You&apos;ll be the admin and can update everything later.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Community Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunset Ridge HOA"
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Street Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Zip Code</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  value={zip}
                  onChange={(e) => handleZipChange(e.target.value)}
                  placeholder="Enter zip to auto-fill city, state, and timezone"
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
                {lookingUp && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">Looking up...</span>
                )}
                {lookupDone && !lookingUp && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-600">Found</span>
                )}
              </div>
            </div>

            {/* Auto-filled fields — shown after zip lookup or manually editable */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Auto-filled from zip"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none ${lookupDone ? 'border-emerald-300 bg-emerald-50' : 'border-stone-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  maxLength={2}
                  placeholder="TX"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none ${lookupDone ? 'border-emerald-300 bg-emerald-50' : 'border-stone-300'}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Timezone
                {lookupDone && timezone && (
                  <span className="ml-2 text-xs font-normal text-emerald-600">
                    Auto-detected: {TZ_LABELS[timezone] ?? timezone}
                  </span>
                )}
              </label>
              <select
                required
                value={timezone || 'America/Chicago'}
                onChange={(e) => setTimezone(e.target.value)}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none ${lookupDone ? 'border-emerald-300 bg-emerald-50' : 'border-stone-300'}`}
              >
                <option value="America/New_York">Eastern</option>
                <option value="America/Chicago">Central</option>
                <option value="America/Denver">Mountain</option>
                <option value="America/Los_Angeles">Pacific</option>
                <option value="America/Anchorage">Alaska</option>
                <option value="Pacific/Honolulu">Hawaii</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
          >
            {loading ? 'Creating community...' : 'Create community'}
          </button>

          <p className="text-center text-xs text-stone-400">
            By creating a community you agree to the <a href="/terms" target="_blank" className="text-emerald-600 underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-emerald-600 underline">Privacy Policy</a>.
          </p>
        </form>

        {/* Escape hatches */}
        <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white p-5">
          <p className="text-sm font-medium text-stone-700 text-center">Not a property manager?</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            <Link
              href="/join"
              className="block w-full rounded-full border border-stone-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Join an existing community
            </Link>
            <Link
              href="/browse"
              className="block w-full rounded-full border border-stone-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Browse public amenities
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
