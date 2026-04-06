'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type CommunityMember = {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  unitNumber?: string
  joinedAt: string
}

type AmenityRef = { id: string; name: string }

type RecentBooking = {
  id: string
  amenityId: string
  residentId: string
  status: string
  startDatetime: string
  endDatetime: string
  createdAt: string
  bookedByName: string | null
}

type CommunityStats = {
  memberCount: number
  approvedMembers: number
  pendingMembers: number
  amenityCount: number
  bookingCount: number
  bookingsByStatus: Record<string, number>
}

type CommunityDetail = {
  id: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  zip: string
  contactEmail: string
  contactPhone: string | null
  plan: string
  maxAmenities: number
  maxMembers: number
  isActive: boolean
  createdAt: string
  members: CommunityMember[]
  stats?: CommunityStats
  amenities?: AmenityRef[]
  recentBookings?: RecentBooking[]
}

export default function CommunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const communityId = params.id as string

  const [community, setCommunity] = useState<CommunityDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'activity'>('details')

  // Editable fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [plan, setPlan] = useState('free')
  const [maxAmenities, setMaxAmenities] = useState(5)
  const [maxMembers, setMaxMembers] = useState(50)

  useEffect(() => {
    fetch(`/api/internal/communities/${communityId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load community')
        return r.json()
      })
      .then((d) => {
        const c = d.community as CommunityDetail
        setCommunity(c)
        setName(c.name)
        setSlug(c.slug)
        setAddress(c.address)
        setCity(c.city)
        setState(c.state)
        setZip(c.zip)
        setContactEmail(c.contactEmail)
        setContactPhone(c.contactPhone ?? '')
        setPlan(c.plan)
        setMaxAmenities(c.maxAmenities)
        setMaxMembers(c.maxMembers)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [communityId])

  function amenityName(id: string) {
    return community?.amenities?.find((a) => a.id === id)?.name ?? 'Unknown'
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/internal/communities/${communityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, slug, address, city, state, zip,
          contactEmail, contactPhone: contactPhone || null,
          plan, maxAmenities, maxMembers,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to update community')
      }

      const data = await res.json()
      setCommunity(data.community)
      setSaving(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  async function handleToggleActive() {
    if (!community) return
    setSaving(true)

    try {
      const res = await fetch(`/api/internal/communities/${communityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !community.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      const data = await res.json()
      setCommunity(data.community)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      const res = await fetch(`/api/internal/communities/${communityId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete community')
      router.push('/internal')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const statusColor: Record<string, string> = {
    CONFIRMED: 'text-emerald-700 bg-emerald-50',
    PENDING_APPROVAL: 'text-yellow-700 bg-yellow-50',
    APPROVED: 'text-blue-700 bg-blue-50',
    DENIED: 'text-red-700 bg-red-50',
    CANCELLED: 'text-stone-500 bg-stone-100',
    COMPLETED: 'text-emerald-700 bg-emerald-50',
    CLOSED: 'text-stone-500 bg-stone-100',
    WAITLISTED: 'text-purple-700 bg-purple-50',
    PAYMENT_PENDING: 'text-amber-700 bg-amber-50',
    IN_PROGRESS: 'text-blue-700 bg-blue-50',
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link
            href="/internal"
            className="text-sm text-purple-700 hover:text-purple-900"
          >
            &larr; Back to dashboard
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-12 animate-pulse rounded-xl bg-stone-200" />
            <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
          </div>
        ) : error && !community ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error}
          </div>
        ) : community ? (
          <>
            {/* Community header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900">
                  {community.name}
                </h2>
                <p className="text-sm text-stone-500">/{community.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleActive}
                  disabled={saving}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    community.isActive
                      ? 'border border-stone-300 text-stone-600 hover:bg-stone-50'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  } disabled:opacity-50`}
                >
                  {community.isActive ? 'Deactivate' : 'Activate'}
                </button>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600">Are you sure?</span>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="text-sm text-stone-500 hover:text-stone-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stats cards */}
            {community.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs text-stone-500">Members</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">
                    {community.stats.approvedMembers}
                  </p>
                  {community.stats.pendingMembers > 0 && (
                    <p className="text-xs text-yellow-600">
                      {community.stats.pendingMembers} pending
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs text-stone-500">Amenities</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">
                    {community.stats.amenityCount}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs text-stone-500">Total Bookings</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">
                    {community.stats.bookingCount}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs text-stone-500">Plan</p>
                  <p className="mt-1 text-xl font-bold capitalize text-purple-700">
                    {community.plan}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs text-stone-500">Status</p>
                  <p
                    className={`mt-1 text-xl font-bold ${
                      community.isActive ? 'text-emerald-600' : 'text-stone-400'
                    }`}
                  >
                    {community.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            )}

            {/* Booking status breakdown */}
            {community.stats &&
              Object.keys(community.stats.bookingsByStatus).length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-white p-4 mb-6">
                  <p className="text-xs font-medium text-stone-600 mb-2">
                    Bookings by Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(community.stats.bookingsByStatus)
                      .sort(([, a], [, b]) => b - a)
                      .map(([status, count]) => (
                        <span
                          key={status}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusColor[status] ?? 'bg-stone-100 text-stone-600'}`}
                        >
                          {status.replace(/_/g, ' ')} ({count})
                        </span>
                      ))}
                  </div>
                </div>
              )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-stone-200">
              {(['details', 'members', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-b-2 border-purple-700 text-purple-700'
                      : 'text-stone-500 hover:text-stone-700'
                  }`}
                >
                  {tab}
                  {tab === 'members' && ` (${community.members?.length ?? 0})`}
                  {tab === 'activity' &&
                    ` (${community.recentBookings?.length ?? 0})`}
                </button>
              ))}
            </div>

            {/* Tab: Details */}
            {activeTab === 'details' && (
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="font-semibold text-stone-900 mb-4">
                  Community Details
                </h3>
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Slug</label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Address</label>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={inputClass}
                    />
                  </div>

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
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Contact Email</label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Contact Phone</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

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

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Max Amenities</label>
                      <input
                        type="number"
                        min={1}
                        value={maxAmenities}
                        onChange={(e) =>
                          setMaxAmenities(Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Max Members</label>
                      <input
                        type="number"
                        min={1}
                        value={maxMembers}
                        onChange={(e) =>
                          setMaxMembers(Number(e.target.value))
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-full bg-purple-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {/* Tab: Members */}
            {activeTab === 'members' && (
              <div className="rounded-xl border border-stone-200 bg-white">
                {!community.members || community.members.length === 0 ? (
                  <div className="px-5 py-12 text-center text-stone-500">
                    No members yet.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {community.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <p className="text-sm font-medium text-stone-900">
                            {m.name}
                          </p>
                          <p className="text-xs text-stone-500">{m.email}</p>
                          {m.unitNumber && (
                            <p className="text-xs text-stone-400">
                              Unit: {m.unitNumber}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                            {m.role.replace('_', ' ')}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              m.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : m.status === 'pending'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {m.status}
                          </span>
                          <span className="text-xs text-stone-400">
                            {new Date(m.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Activity */}
            {activeTab === 'activity' && (
              <div className="space-y-4">
                {/* Amenity list */}
                {community.amenities && community.amenities.length > 0 && (
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-stone-900 mb-3">
                      Amenities ({community.amenities.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {community.amenities.map((a) => (
                        <span
                          key={a.id}
                          className="rounded-full border border-stone-200 px-3 py-1 text-xs text-stone-700"
                        >
                          {a.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent bookings */}
                <div className="rounded-xl border border-stone-200 bg-white">
                  <div className="border-b border-stone-200 px-5 py-4">
                    <h3 className="font-semibold text-stone-900">
                      Recent Bookings
                    </h3>
                  </div>
                  {!community.recentBookings ||
                  community.recentBookings.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-stone-400">
                      No bookings yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-50">
                      {community.recentBookings.map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center justify-between px-5 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-stone-900">
                              {amenityName(b.amenityId)}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[b.status] ?? 'bg-stone-100 text-stone-600'}`}
                              >
                                {b.status.replace(/_/g, ' ')}
                              </span>
                              {b.bookedByName && (
                                <span className="text-xs text-stone-400">
                                  by {b.bookedByName}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-stone-600">
                              {new Date(b.startDatetime).toLocaleDateString()}{' '}
                              {new Date(b.startDatetime).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                              {' - '}
                              {new Date(b.endDatetime).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                            <p className="text-xs text-stone-400">
                              Created{' '}
                              {new Date(b.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
