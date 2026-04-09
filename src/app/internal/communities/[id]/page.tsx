'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type CommunityMember = {
  id: string
  userId: string
  residentId: string
  name: string
  email: string
  phone: string | null
  role: string
  status: string
  unitNumber?: string
  joinedAt: string
}

type CommunityStats = {
  memberCount: number
  approvedMembers: number
  pendingMembers: number
  amenityCount: number
  bookingCount: number
  bookingsThisMonth: number
  bookingsLastMonth: number
  bookingsByStatus: Record<string, number>
}

type UsageData = {
  popularAmenities: { amenityId: string; name: string; bookings: number }[]
  peakDays: { day: string; bookings: number }[]
  peakHours: { hour: number; label: string; bookings: number }[]
  monthlyBookings: { month: string; count: number }[]
  topBookers: { residentId: string; name: string; bookings: number }[]
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
  usage?: UsageData
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
  const [activeTab, setActiveTab] = useState<'usage' | 'members' | 'settings'>('usage')
  const [searchEmail, setSearchEmail] = useState('')
  const [searchResult, setSearchResult] = useState<{ found: boolean; name?: string; email?: string } | null>(null)
  const [searching, setSearching] = useState(false)
  const [addMemberName, setAddMemberName] = useState('')
  const [addMemberRole, setAddMemberRole] = useState<string>('admin')
  const [addingMember, setAddingMember] = useState(false)
  const [addMemberNotice, setAddMemberNotice] = useState<string | null>(null)
  const [changingRole, setChangingRole] = useState<string | null>(null)

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
        throw new Error(data.error ?? 'Failed to update')
      }
      const data = await res.json()
      setCommunity(data.community)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
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
      const res = await fetch(`/api/internal/communities/${communityId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      router.push('/internal')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  async function handleSearchEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!searchEmail.trim()) return
    setSearching(true)
    setSearchResult(null)
    setAddMemberNotice(null)
    try {
      const res = await fetch(`/api/internal/users?q=${encodeURIComponent(searchEmail.trim())}&limit=1`)
      const data = await res.json()
      const match = (data.users ?? []).find(
        (u: { email: string }) => u.email.toLowerCase() === searchEmail.trim().toLowerCase(),
      )
      if (match) {
        setSearchResult({ found: true, name: match.name, email: match.email })
        setAddMemberName(match.name)
      } else {
        setSearchResult({ found: false })
        setAddMemberName('')
      }
    } catch {
      setAddMemberNotice('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  async function handleAddMember() {
    const email = searchResult?.found ? searchResult.email! : searchEmail.trim()
    const memberName = searchResult?.found ? (searchResult.name ?? addMemberName) : addMemberName
    if (!email || !memberName) return
    setAddingMember(true)
    setAddMemberNotice(null)
    try {
      const res = await fetch(`/api/internal/communities/${communityId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: memberName, role: addMemberRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add member')
      if (data.linked) {
        setAddMemberNotice(`${email} added as ${addMemberRole.replace('_', ' ')}.`)
      } else {
        setAddMemberNotice(`Invite sent to ${email}. They'll be linked as ${addMemberRole.replace('_', ' ')} when they sign up.`)
      }
      setSearchEmail('')
      setSearchResult(null)
      setAddMemberName('')
      // Reload community data
      const refreshRes = await fetch(`/api/internal/communities/${communityId}`)
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setCommunity(refreshData.community)
      }
    } catch (err: unknown) {
      setAddMemberNotice(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    setChangingRole(memberId)
    try {
      const res = await fetch(`/api/internal/communities/${communityId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to update role'); return }
      // Refresh community data
      const refreshRes = await fetch(`/api/internal/communities/${communityId}`)
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setCommunity(refreshData.community)
      }
    } catch {
      setError('Failed to update role')
    } finally {
      setChangingRole(null)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500'
  const labelClass = 'block text-sm font-medium text-stone-700 mb-1'

  // Bar chart helper — renders a simple horizontal bar
  function Bar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
      <div className="h-2 w-full rounded-full bg-stone-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-purple-200 bg-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-purple-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Internal
            </span>
            <h1 className="text-lg font-semibold text-stone-900">
              Platform Dashboard
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/internal" className="text-sm text-purple-700 hover:text-purple-900">
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
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-stone-900">{community.name}</h2>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${community.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-400'}`}>
                    {community.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-stone-500">
                  {community.city && community.state ? `${community.city}, ${community.state}` : `/${community.slug}`}
                  {' · '}
                  <span className="capitalize">{community.plan}</span> plan
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleActive}
                  disabled={saving}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${community.isActive ? 'border border-stone-300 text-stone-600 hover:bg-stone-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'} disabled:opacity-50`}
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
                    <span className="text-sm text-red-600">Sure?</span>
                    <button onClick={handleDelete} disabled={saving} className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                      Confirm
                    </button>
                    <button onClick={() => setDeleteConfirm(false)} className="text-sm text-stone-500 hover:text-stone-700">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Stat cards */}
            {community.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Residents</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">{community.stats.approvedMembers}</p>
                  {community.stats.pendingMembers > 0 && (
                    <p className="mt-0.5 text-xs text-yellow-600">{community.stats.pendingMembers} pending</p>
                  )}
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Amenities</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">{community.stats.amenityCount}</p>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">Bookings / Mo</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">{community.stats.bookingsThisMonth}</p>
                  {community.stats.bookingsLastMonth > 0 && (() => {
                    const trend = Math.round(((community.stats!.bookingsThisMonth - community.stats!.bookingsLastMonth) / community.stats!.bookingsLastMonth) * 100)
                    return (
                      <p className={`mt-0.5 text-xs ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-500' : 'text-stone-400'}`}>
                        {trend > 0 ? '+' : ''}{trend}% vs last month
                      </p>
                    )
                  })()}
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">All-Time</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">{community.stats.bookingCount}</p>
                  <p className="mt-0.5 text-xs text-stone-400">bookings</p>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b border-stone-200">
              {(['usage', 'members', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'border-b-2 border-purple-700 text-purple-700' : 'text-stone-500 hover:text-stone-700'}`}
                >
                  {tab === 'usage' ? 'Usage & Insights' : tab === 'members' ? `Members (${community.members?.length ?? 0})` : 'Settings'}
                </button>
              ))}
            </div>

            {/* ===== Usage & Insights Tab ===== */}
            {activeTab === 'usage' && community.usage && (
              <div className="space-y-6">
                {/* Popular Amenities */}
                <div className="rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-stone-900 mb-4">Most Popular Amenities</h3>
                  {community.usage.popularAmenities.length === 0 ? (
                    <p className="text-sm text-stone-400">No booking data yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {community.usage.popularAmenities.map((a, i) => (
                        <div key={a.amenityId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-stone-700">
                              <span className="text-stone-400 mr-2">{i + 1}.</span>
                              {a.name}
                            </span>
                            <span className="text-sm font-semibold text-stone-900">{a.bookings}</span>
                          </div>
                          <Bar value={a.bookings} max={community.usage!.popularAmenities[0].bookings} color="bg-purple-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Peak Days */}
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-stone-900 mb-4">Busiest Days</h3>
                    {community.usage.peakDays.filter((d) => d.bookings > 0).length === 0 ? (
                      <p className="text-sm text-stone-400">No booking data yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {community.usage.peakDays
                          .filter((d) => d.bookings > 0)
                          .map((d) => (
                            <div key={d.day}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-stone-600">{d.day}</span>
                                <span className="text-sm font-semibold text-stone-900">{d.bookings}</span>
                              </div>
                              <Bar
                                value={d.bookings}
                                max={community.usage!.peakDays[0].bookings}
                                color="bg-emerald-500"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Peak Hours */}
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-stone-900 mb-4">Peak Hours</h3>
                    {community.usage.peakHours.length === 0 ? (
                      <p className="text-sm text-stone-400">No booking data yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {community.usage.peakHours.map((h) => (
                          <div key={h.hour}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-stone-600">{h.label}</span>
                              <span className="text-sm font-semibold text-stone-900">{h.bookings}</span>
                            </div>
                            <Bar
                              value={h.bookings}
                              max={community.usage!.peakHours[0].bookings}
                              color="bg-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Monthly Trend */}
                <div className="rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-stone-900 mb-4">Booking Trend (6 months)</h3>
                  {(() => {
                    const max = Math.max(...community.usage!.monthlyBookings.map((m) => m.count), 1)
                    return (
                      <div className="flex items-end gap-2 h-32">
                        {community.usage!.monthlyBookings.map((m) => (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-semibold text-stone-700">{m.count}</span>
                            <div
                              className="w-full rounded-t bg-purple-400 transition-all"
                              style={{ height: `${Math.max((m.count / max) * 100, 2)}%` }}
                            />
                            <span className="text-[10px] text-stone-400 whitespace-nowrap">{m.month}</span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {/* Top Bookers */}
                {community.usage.topBookers.length > 0 && (
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-stone-900 mb-4">Most Active Residents</h3>
                    <div className="space-y-2.5">
                      {community.usage.topBookers.map((b, i) => (
                        <div key={b.residentId}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-stone-700">
                              <span className="text-stone-400 mr-2">{i + 1}.</span>
                              {b.name}
                            </span>
                            <span className="text-sm font-semibold text-stone-900">
                              {b.bookings} booking{b.bookings !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Bar
                            value={b.bookings}
                            max={community.usage!.topBookers[0].bookings}
                            color="bg-amber-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Status Breakdown */}
                {community.stats && Object.keys(community.stats.bookingsByStatus).length > 0 && (
                  <div className="rounded-xl border border-stone-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-stone-900 mb-3">Booking Status Breakdown</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(community.stats.bookingsByStatus)
                        .sort(([, a], [, b]) => b - a)
                        .map(([status, count]) => {
                          const colors: Record<string, string> = {
                            CONFIRMED: 'bg-emerald-50 text-emerald-700',
                            PENDING_APPROVAL: 'bg-yellow-50 text-yellow-700',
                            APPROVED: 'bg-blue-50 text-blue-700',
                            DENIED: 'bg-red-50 text-red-700',
                            CANCELLED: 'bg-stone-100 text-stone-500',
                            COMPLETED: 'bg-emerald-50 text-emerald-700',
                            CLOSED: 'bg-stone-100 text-stone-500',
                            WAITLISTED: 'bg-purple-50 text-purple-700',
                            PAYMENT_PENDING: 'bg-amber-50 text-amber-700',
                          }
                          return (
                            <span key={status} className={`rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] ?? 'bg-stone-100 text-stone-600'}`}>
                              {status.replace(/_/g, ' ')} ({count})
                            </span>
                          )
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== Members Tab ===== */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                {/* Add member — search first, then add */}
                <div className="rounded-xl border border-purple-200 bg-purple-50 p-5">
                  <p className="text-sm font-semibold text-purple-800 mb-3">Add Member</p>

                  {/* Step 1: Search by email */}
                  <form onSubmit={handleSearchEmail} className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={searchEmail}
                      onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); setAddMemberNotice(null) }}
                      placeholder="Search by email..."
                      className={`flex-1 ${inputClass}`}
                    />
                    <button
                      type="submit"
                      disabled={searching || !searchEmail.trim()}
                      className="rounded-full bg-purple-700 px-5 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
                    >
                      {searching ? 'Searching...' : 'Search'}
                    </button>
                  </form>

                  {/* Step 2: Result */}
                  {searchResult && (
                    <div className="mt-3 rounded-lg border border-purple-100 bg-white p-4">
                      {searchResult.found ? (
                        <>
                          <p className="text-sm text-stone-900">
                            <span className="font-medium">{searchResult.name}</span>
                            <span className="text-stone-400 ml-2">{searchResult.email}</span>
                          </p>
                          <div className="mt-3 flex items-center gap-2">
                            <select
                              value={addMemberRole}
                              onChange={(e) => setAddMemberRole(e.target.value)}
                              className={`w-44 ${inputClass}`}
                            >
                              <option value="admin">Admin</option>
                              <option value="property_manager">Property Manager</option>
                              <option value="board">Board</option>
                              <option value="janitorial">Janitorial</option>
                              <option value="resident">Resident</option>
                            </select>
                            <button
                              onClick={handleAddMember}
                              disabled={addingMember}
                              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                            >
                              {addingMember ? 'Adding...' : 'Add to community'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-stone-600 mb-3">
                            No Neighbri account found for <strong>{searchEmail}</strong>.
                            Enter their name to send an invitation.
                          </p>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={addMemberName}
                              onChange={(e) => setAddMemberName(e.target.value)}
                              placeholder="Full name"
                              className={`flex-1 ${inputClass}`}
                            />
                            <select
                              value={addMemberRole}
                              onChange={(e) => setAddMemberRole(e.target.value)}
                              className={`w-44 ${inputClass}`}
                            >
                              <option value="admin">Admin</option>
                              <option value="property_manager">Property Manager</option>
                              <option value="board">Board</option>
                              <option value="janitorial">Janitorial</option>
                              <option value="resident">Resident</option>
                            </select>
                            <button
                              onClick={handleAddMember}
                              disabled={addingMember || !addMemberName.trim()}
                              className="rounded-full bg-purple-700 px-5 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
                            >
                              {addingMember ? 'Sending...' : 'Send invite'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {addMemberNotice && (
                    <p className="mt-3 text-xs text-purple-700">{addMemberNotice}</p>
                  )}
                </div>

              <div className="rounded-xl border border-stone-200 bg-white">
                {!community.members || community.members.length === 0 ? (
                  <div className="px-5 py-12 text-center text-stone-500">No members yet.</div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {[...community.members]
                      .sort((a, b) => {
                        // Admins first, then by status (pending before approved), then by name
                        if (a.role === 'admin' && b.role !== 'admin') return -1
                        if (b.role === 'admin' && a.role !== 'admin') return 1
                        if (a.status === 'pending' && b.status !== 'pending') return -1
                        if (b.status === 'pending' && a.status !== 'pending') return 1
                        return a.name.localeCompare(b.name)
                      })
                      .map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-stone-900">{m.name}</p>
                          <p className="text-xs text-stone-500">{m.email}</p>
                          {m.unitNumber && <p className="text-xs text-stone-400">Unit: {m.unitNumber}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            disabled={changingRole === m.id}
                            className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs font-medium text-stone-700 disabled:opacity-50"
                          >
                            <option value="admin">Admin</option>
                            <option value="property_manager">Property Manager</option>
                            <option value="board">Board</option>
                            <option value="janitorial">Janitorial</option>
                            <option value="resident">Resident</option>
                          </select>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : m.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>
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
              </div>
            )}

            {/* ===== Settings Tab ===== */}
            {activeTab === 'settings' && (
              <div className="rounded-xl border border-stone-200 bg-white p-6">
                <h3 className="font-semibold text-stone-900 mb-4">Community Settings</h3>
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Name</label>
                      <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Slug</label>
                      <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Address</label>
                    <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className={labelClass}>City</label>
                      <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>State</label>
                      <input type="text" required value={state} onChange={(e) => setState(e.target.value)} maxLength={2} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Zip</label>
                      <input type="text" required value={zip} onChange={(e) => setZip(e.target.value)} maxLength={10} className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Plan</label>
                    <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Max Amenities</label>
                      <input type="number" min={1} value={maxAmenities} onChange={(e) => setMaxAmenities(Number(e.target.value))} className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Max Members</label>
                      <input type="number" min={1} value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))} className={inputClass} />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="rounded-full bg-purple-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
