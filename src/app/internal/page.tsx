'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type CommunityStat = {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  memberCount: number
  approvedCount: number
  pendingCount: number
  bookingCount: number
  amenityCount: number
}

type Overview = {
  totalCommunities: number
  activeCommunities: number
  totalMembers: number
  approvedMembers: number
  pendingMembers: number
  totalBookings: number
  totalAmenities: number
  totalResidents: number
}

type RecentBooking = {
  id: string
  amenityId: string
  status: string
  communityId: string | null
  createdAt: string
  startDatetime: string
}

type RecentMember = {
  id: string
  communityId: string
  userId: string
  residentId: string
  role: string
  status: string
  joinedAt: string
}

type BookingsByStatus = Record<string, number>

export default function InternalDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [communityStats, setCommunityStats] = useState<CommunityStat[]>([])
  const [bookingsByStatus, setBookingsByStatus] = useState<BookingsByStatus>({})
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([])
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/internal/metrics')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load metrics')
        return r.json()
      })
      .then((d) => {
        setOverview(d.overview)
        setCommunityStats(d.communityStats ?? [])
        setBookingsByStatus(d.bookingsByStatus ?? {})
        setRecentBookings(d.recentBookings ?? [])
        setRecentMembers(d.recentMembers ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function communityName(id: string | null) {
    if (!id) return 'Unknown'
    return communityStats.find((c) => c.id === id)?.name ?? id.slice(0, 8) + '...'
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

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Internal header */}
      <div className="border-b border-purple-200 bg-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded bg-purple-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                Internal
              </span>
              <h1 className="text-lg font-semibold text-stone-900">
                Neighbri Platform Admin
              </h1>
            </div>
            <Link
              href="/internal/users"
              className="rounded-full border border-purple-300 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
            >
              All Users
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error}
          </div>
        ) : overview ? (
          <>
            {/* Overview stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">Communities</p>
                <p className="mt-1 text-2xl font-bold text-purple-700">
                  {overview.activeCommunities}
                  {overview.totalCommunities > overview.activeCommunities && (
                    <span className="ml-1 text-sm font-normal text-stone-400">
                      / {overview.totalCommunities}
                    </span>
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">Members</p>
                <p className="mt-1 text-2xl font-bold text-purple-700">
                  {overview.approvedMembers}
                </p>
                {overview.pendingMembers > 0 && (
                  <p className="mt-1 text-xs text-yellow-600">
                    {overview.pendingMembers} pending
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">Total Bookings</p>
                <p className="mt-1 text-2xl font-bold text-purple-700">
                  {overview.totalBookings}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">Amenities</p>
                <p className="mt-1 text-2xl font-bold text-purple-700">
                  {overview.totalAmenities}
                </p>
              </div>
            </div>

            {/* Booking status breakdown */}
            {Object.keys(bookingsByStatus).length > 0 && (
              <div className="rounded-xl border border-stone-200 bg-white p-5 mb-8">
                <h3 className="text-sm font-semibold text-stone-900 mb-3">
                  Bookings by Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(bookingsByStatus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <span
                        key={status}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[status] ?? 'bg-stone-100 text-stone-600'}`}
                      >
                        {status.replace(/_/g, ' ')} ({count})
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Communities table */}
            <div className="rounded-xl border border-stone-200 bg-white mb-8">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <h2 className="font-semibold text-stone-900">Communities</h2>
                <Link
                  href="/internal/communities/new"
                  className="rounded-full bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800"
                >
                  Create Community
                </Link>
              </div>

              {communityStats.length === 0 ? (
                <div className="px-5 py-12 text-center text-stone-500">
                  No communities yet. Create your first one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-left text-xs text-stone-500">
                        <th className="px-5 py-3 font-medium">Community</th>
                        <th className="px-3 py-3 font-medium">Plan</th>
                        <th className="px-3 py-3 font-medium text-right">Members</th>
                        <th className="px-3 py-3 font-medium text-right">Pending</th>
                        <th className="px-3 py-3 font-medium text-right">Amenities</th>
                        <th className="px-3 py-3 font-medium text-right">Bookings</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {communityStats.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-stone-50 transition-colors"
                        >
                          <td className="px-5 py-3">
                            <Link
                              href={`/internal/communities/${c.id}`}
                              className="font-medium text-purple-700 hover:text-purple-900"
                            >
                              {c.name}
                            </Link>
                            <p className="text-xs text-stone-400">/{c.slug}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                              {c.plan}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-stone-900">
                            {c.approvedCount}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {c.pendingCount > 0 ? (
                              <span className="font-medium text-yellow-600">
                                {c.pendingCount}
                              </span>
                            ) : (
                              <span className="text-stone-400">0</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-stone-600">
                            {c.amenityCount}
                          </td>
                          <td className="px-3 py-3 text-right text-stone-600">
                            {c.bookingCount}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                c.isActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-stone-100 text-stone-500'
                              }`}
                            >
                              {c.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Activity feeds side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent bookings */}
              <div className="rounded-xl border border-stone-200 bg-white">
                <div className="border-b border-stone-200 px-5 py-4">
                  <h3 className="font-semibold text-stone-900">
                    Recent Bookings
                  </h3>
                </div>
                {recentBookings.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-stone-400">
                    No bookings yet.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {recentBookings.slice(0, 10).map((b) => (
                      <div
                        key={b.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[b.status] ?? 'bg-stone-100 text-stone-600'}`}
                          >
                            {b.status.replace(/_/g, ' ')}
                          </span>
                          <p className="mt-1 text-xs text-stone-500">
                            {communityName(b.communityId)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-stone-600">
                            {new Date(b.startDatetime).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-stone-400">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent members */}
              <div className="rounded-xl border border-stone-200 bg-white">
                <div className="border-b border-stone-200 px-5 py-4">
                  <h3 className="font-semibold text-stone-900">
                    Recent Join Requests
                  </h3>
                </div>
                {recentMembers.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-stone-400">
                    No join requests yet.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-50">
                    {recentMembers.slice(0, 10).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-5 py-3"
                      >
                        <div>
                          <Link
                            href={`/internal/communities/${m.communityId}`}
                            className="text-sm font-medium text-purple-700 hover:text-purple-900"
                          >
                            {communityName(m.communityId)}
                          </Link>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">
                              {m.role.replace('_', ' ')}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                                m.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : m.status === 'pending'
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-stone-400">
                          {new Date(m.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
