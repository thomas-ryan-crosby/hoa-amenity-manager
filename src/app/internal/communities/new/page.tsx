'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CreateCommunityPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [plan, setPlan] = useState('free')
  const [maxAmenities, setMaxAmenities] = useState(5)
  const [maxMembers, setMaxMembers] = useState(50)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminName, setAdminName] = useState('')

  useEffect(() => {
    if (!slugManual) {
      setSlug(slugify(name))
    }
  }, [name, slugManual])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/internal/communities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          address,
          city,
          state,
          zip,
          timezone,
          plan,
          maxAmenities,
          maxMembers,
          adminEmail,
          adminName,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to create community')
      }

      const data = await res.json()
      router.push(`/internal/communities/${data.community.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500'
  const labelClass = 'block text-sm font-medium text-stone-700 mb-1'

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Internal header */}
      <div className="border-b border-purple-200 bg-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-purple-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Internal
            </span>
            <h1 className="text-lg font-semibold text-stone-900">
              Neighbri Platform Admin
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            href="/internal"
            className="text-sm text-purple-700 hover:text-purple-900"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-900 mb-6">
            Create Community
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className={labelClass}>Community Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunset Ridge HOA"
                className={inputClass}
              />
            </div>

            {/* Slug */}
            <div>
              <label className={labelClass}>Slug</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">/</span>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => {
                    setSlugManual(true)
                    setSlug(e.target.value)
                  }}
                  placeholder="sunset-ridge-hoa"
                  className={inputClass}
                />
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Auto-generated from name. Edit to customize.
              </p>
            </div>

            {/* Address */}
            <div>
              <label className={labelClass}>Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St"
                className={inputClass}
              />
            </div>

            {/* City / State / Zip */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  maxLength={2}
                  placeholder="CA"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Zip</label>
                <input
                  type="text"
                  required
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  maxLength={10}
                  placeholder="90210"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Timezone */}
            <div>
              <label className={labelClass}>Timezone</label>
              <select
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={inputClass}
              >
                <option value="America/New_York">Eastern (America/New_York)</option>
                <option value="America/Chicago">Central (America/Chicago)</option>
                <option value="America/Denver">Mountain (America/Denver)</option>
                <option value="America/Los_Angeles">Pacific (America/Los_Angeles)</option>
                <option value="America/Anchorage">Alaska (America/Anchorage)</option>
                <option value="Pacific/Honolulu">Hawaii (Pacific/Honolulu)</option>
              </select>
            </div>

            {/* First Admin */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-800 mb-3">First Admin (required)</p>
              <p className="text-xs text-purple-600 mb-3">
                This person will manage the community — approvals, amenity setup, billing, etc.
                They must have a Neighbri account before the community is created.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Admin Name</label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Jane Smith"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Admin Email</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="jane@example.com"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className={labelClass}>Plan</label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className={inputClass}
              >
                <option value="free">Free</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Max Amenities</label>
                <input
                  type="number"
                  min={1}
                  value={maxAmenities}
                  onChange={(e) => setMaxAmenities(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Max Members</label>
                <input
                  type="number"
                  min={1}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-purple-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Community'}
              </button>
              <Link
                href="/internal"
                className="text-sm text-stone-500 hover:text-stone-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
