'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Platform = {
  totalCommunities: number
  activeCommunities: number
  totalResidents: number
  totalPending: number
  totalBookings: number
  bookingsThisMonth: number
  bookingsLastMonth: number
  newMembersThisMonth: number
}

type CommunityRow = {
  id: string
  name: string
  slug: string
  city: string | null
  state: string | null
  plan: string
  isActive: boolean
  residents: number
  pending: number
  totalBookings: number
  bookingsThisMonth: number
  bookingsLastMonth: number
  bookingsTrend: number
  newMembersThisMonth: number
}

export default function InternalDashboard() {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [communities, setCommunities] = useState<CommunityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'residents' | 'bookingsThisMonth' | 'name'>('residents')

  useEffect(() => {
    fetch('/api/internal/metrics')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load metrics')
        return r.json()
      })
      .then((d) => {
        setPlatform(d.platform)
        setCommunities(d.communities ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const sorted = [...communities].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name)
    return b[sortBy] - a[sortBy]
  })

  function trendLabel(trend: number) {
    if (trend > 0) return `+${trend}%`
    if (trend < 0) return `${trend}%`
    return '—'
  }

  function trendColor(trend: number) {
    if (trend > 0) return 'text-emerald-600'
    if (trend < 0) return 'text-red-500'
    return 'text-stone-400'
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="border-b border-purple-200 bg-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded bg-purple-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
                Internal
              </span>
              <h1 className="text-lg font-semibold text-stone-900">
                Platform Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/internal/employees"
                className="rounded-full border border-purple-300 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
              >
                Employees
              </Link>
              <Link
                href="/internal/users"
                className="rounded-full border border-purple-300 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
              >
                User Lookup
              </Link>
              <Link
                href="/internal/communities/new"
                className="rounded-full bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800"
              >
                Add Community
              </Link>
            </div>
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
        ) : platform ? (
          <>
            {/* Platform totals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Communities
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {platform.activeCommunities}
                </p>
                {platform.totalCommunities > platform.activeCommunities && (
                  <p className="mt-1 text-xs text-stone-400">
                    {platform.totalCommunities - platform.activeCommunities} inactive
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Total Residents
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {platform.totalResidents}
                </p>
                {platform.totalPending > 0 && (
                  <p className="mt-1 text-xs text-yellow-600">
                    {platform.totalPending} pending approval
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Bookings This Month
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {platform.bookingsThisMonth}
                </p>
                <p className={`mt-1 text-xs ${trendColor(
                  platform.bookingsLastMonth > 0
                    ? Math.round(((platform.bookingsThisMonth - platform.bookingsLastMonth) / platform.bookingsLastMonth) * 100)
                    : platform.bookingsThisMonth > 0 ? 100 : 0
                )}`}>
                  {trendLabel(
                    platform.bookingsLastMonth > 0
                      ? Math.round(((platform.bookingsThisMonth - platform.bookingsLastMonth) / platform.bookingsLastMonth) * 100)
                      : platform.bookingsThisMonth > 0 ? 100 : 0
                  )}{' '}
                  vs last month
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  New Members This Month
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {platform.newMembersThisMonth}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {platform.totalBookings} all-time bookings
                </p>
              </div>
            </div>

            {/* Community table */}
            <div className="rounded-xl border border-stone-200 bg-white">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <h2 className="font-semibold text-stone-900">
                  Community Overview
                </h2>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-stone-400 mr-1">Sort:</span>
                  {(['residents', 'bookingsThisMonth', 'name'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                        sortBy === key
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-stone-500 hover:text-stone-700'
                      }`}
                    >
                      {key === 'bookingsThisMonth' ? 'Activity' : key === 'residents' ? 'Residents' : 'Name'}
                    </button>
                  ))}
                </div>
              </div>

              {communities.length === 0 ? (
                <div className="px-5 py-12 text-center text-stone-500">
                  No communities yet. Create your first one.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-left text-xs text-stone-400 uppercase tracking-wide">
                        <th className="px-5 py-3 font-medium">Community</th>
                        <th className="px-3 py-3 font-medium text-right">Residents</th>
                        <th className="px-3 py-3 font-medium text-right">Pending</th>
                        <th className="px-3 py-3 font-medium text-right">Bookings / Mo</th>
                        <th className="px-3 py-3 font-medium text-right">Trend</th>
                        <th className="px-3 py-3 font-medium text-right">New Members</th>
                        <th className="px-3 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {sorted.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-stone-50 transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <Link
                              href={`/internal/communities/${c.id}`}
                              className="font-medium text-stone-900 hover:text-purple-700"
                            >
                              {c.name}
                            </Link>
                            <p className="mt-0.5 text-xs text-stone-400">
                              {c.city && c.state ? `${c.city}, ${c.state}` : `/${c.slug}`}
                              {' · '}
                              <span className="text-purple-600">{c.plan}</span>
                            </p>
                          </td>
                          <td className="px-3 py-3.5 text-right font-semibold text-stone-900">
                            {c.residents}
                          </td>
                          <td className="px-3 py-3.5 text-right">
                            {c.pending > 0 ? (
                              <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                {c.pending}
                              </span>
                            ) : (
                              <span className="text-stone-300">0</span>
                            )}
                          </td>
                          <td className="px-3 py-3.5 text-right font-semibold text-stone-900">
                            {c.bookingsThisMonth}
                          </td>
                          <td className={`px-3 py-3.5 text-right text-xs font-medium ${trendColor(c.bookingsTrend)}`}>
                            {trendLabel(c.bookingsTrend)}
                          </td>
                          <td className="px-3 py-3.5 text-right text-stone-600">
                            {c.newMembersThisMonth > 0 ? (
                              <span className="text-emerald-600 font-medium">
                                +{c.newMembersThisMonth}
                              </span>
                            ) : (
                              <span className="text-stone-300">0</span>
                            )}
                          </td>
                          <td className="px-3 py-3.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                c.isActive
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-stone-100 text-stone-400'
                              }`}
                            >
                              {c.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Totals row */}
                    <tfoot>
                      <tr className="border-t border-stone-200 bg-stone-50 text-xs font-semibold text-stone-600">
                        <td className="px-5 py-3">
                          {communities.length} communities
                        </td>
                        <td className="px-3 py-3 text-right">
                          {communities.reduce((s, c) => s + c.residents, 0)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {communities.reduce((s, c) => s + c.pending, 0)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {communities.reduce((s, c) => s + c.bookingsThisMonth, 0)}
                        </td>
                        <td className="px-3 py-3" />
                        <td className="px-3 py-3 text-right">
                          {communities.reduce((s, c) => s + c.newMembersThisMonth, 0)}
                        </td>
                        <td className="px-3 py-3" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
