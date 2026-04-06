'use client'

import { useEffect, useState } from 'react'

type Overview = {
  totalMembers: number
  pendingMembers: number
  totalBookings: number
  totalAmenities: number
  bookingsThisMonth: number
  bookingsLastMonth: number
}

type PopularAmenity = {
  amenityId: string
  name: string
  bookings: number
  totalHours: number
}

type PeakDay = { day: string; bookings: number }
type PeakHour = { hour: number; label: string; bookings: number }
type MonthlyBooking = { month: string; count: number }
type TopBooker = { residentId: string; name: string; bookings: number }
type AvgDuration = { name: string; avgHours: number }

export default function InsightsPage() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [popularAmenities, setPopularAmenities] = useState<PopularAmenity[]>([])
  const [peakDays, setPeakDays] = useState<PeakDay[]>([])
  const [peakHours, setPeakHours] = useState<PeakHour[]>([])
  const [monthlyBookings, setMonthlyBookings] = useState<MonthlyBooking[]>([])
  const [bookingsByStatus, setBookingsByStatus] = useState<Record<string, number>>({})
  const [topBookers, setTopBookers] = useState<TopBooker[]>([])
  const [avgDuration, setAvgDuration] = useState<AvgDuration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/insights')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load insights')
        return r.json()
      })
      .then((d) => {
        setOverview(d.overview)
        setPopularAmenities(d.popularAmenities ?? [])
        setPeakDays(d.peakDays ?? [])
        setPeakHours(d.peakHours ?? [])
        setMonthlyBookings(d.monthlyBookings ?? [])
        setBookingsByStatus(d.bookingsByStatus ?? {})
        setTopBookers(d.topBookers ?? [])
        setAvgDuration(d.avgDuration ?? [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  function trendPct() {
    if (!overview) return 0
    if (overview.bookingsLastMonth === 0) return overview.bookingsThisMonth > 0 ? 100 : 0
    return Math.round(
      ((overview.bookingsThisMonth - overview.bookingsLastMonth) / overview.bookingsLastMonth) * 100,
    )
  }

  function Bar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
      <div className="h-2 w-full rounded-full bg-stone-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    CONFIRMED: 'bg-emerald-50 text-emerald-700',
    PENDING_APPROVAL: 'bg-yellow-50 text-yellow-700',
    APPROVED: 'bg-blue-50 text-blue-700',
    DENIED: 'bg-red-50 text-red-700',
    CANCELLED: 'bg-stone-100 text-stone-500',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    CLOSED: 'bg-stone-100 text-stone-500',
    WAITLISTED: 'bg-purple-50 text-purple-700',
    PAYMENT_PENDING: 'bg-amber-50 text-amber-700',
    IN_PROGRESS: 'bg-blue-50 text-blue-700',
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Community
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-900">Insights</h1>
          <p className="mt-2 text-sm text-stone-500">
            Amenity usage patterns, booking trends, and community activity.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error}
          </div>
        ) : overview ? (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Residents
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {overview.totalMembers}
                </p>
                {overview.pendingMembers > 0 && (
                  <p className="mt-1 text-xs text-yellow-600">
                    {overview.pendingMembers} pending
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Amenities
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {overview.totalAmenities}
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  Bookings This Month
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {overview.bookingsThisMonth}
                </p>
                {(() => {
                  const t = trendPct()
                  return (
                    <p className={`mt-1 text-xs ${t > 0 ? 'text-emerald-600' : t < 0 ? 'text-red-500' : 'text-stone-400'}`}>
                      {t > 0 ? '+' : ''}{t}% vs last month
                    </p>
                  )
                })()}
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                  All-Time Bookings
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900">
                  {overview.totalBookings}
                </p>
              </div>
            </div>

            {/* Popular amenities */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 mb-6">
              <h2 className="text-sm font-semibold text-stone-900 mb-5">
                Most Popular Amenities
              </h2>
              {popularAmenities.length === 0 ? (
                <p className="text-sm text-stone-400">No booking data yet.</p>
              ) : (
                <div className="space-y-4">
                  {popularAmenities.map((a, i) => (
                    <div key={a.amenityId}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-stone-700">
                          <span className="text-stone-400 mr-2">{i + 1}.</span>
                          {a.name}
                        </span>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-stone-400">{a.totalHours}h total</span>
                          <span className="font-semibold text-stone-900">
                            {a.bookings} booking{a.bookings !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <Bar
                        value={a.bookings}
                        max={popularAmenities[0].bookings}
                        color="bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Peak days */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-stone-900 mb-5">
                  Busiest Days
                </h2>
                {peakDays.filter((d) => d.bookings > 0).length === 0 ? (
                  <p className="text-sm text-stone-400">No booking data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {peakDays
                      .filter((d) => d.bookings > 0)
                      .map((d) => (
                        <div key={d.day}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-stone-600">{d.day}</span>
                            <span className="text-sm font-semibold text-stone-900">
                              {d.bookings}
                            </span>
                          </div>
                          <Bar
                            value={d.bookings}
                            max={peakDays[0].bookings}
                            color="bg-amber-500"
                          />
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Peak hours */}
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-stone-900 mb-5">
                  Peak Hours
                </h2>
                {peakHours.length === 0 ? (
                  <p className="text-sm text-stone-400">No booking data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {peakHours.map((h) => (
                      <div key={h.hour}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-stone-600">{h.label}</span>
                          <span className="text-sm font-semibold text-stone-900">
                            {h.bookings}
                          </span>
                        </div>
                        <Bar
                          value={h.bookings}
                          max={peakHours[0].bookings}
                          color="bg-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly trend */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6 mb-6">
              <h2 className="text-sm font-semibold text-stone-900 mb-5">
                Booking Trend
              </h2>
              {(() => {
                const max = Math.max(...monthlyBookings.map((m) => m.count), 1)
                return (
                  <div className="flex items-end gap-3 h-36">
                    {monthlyBookings.map((m) => (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-stone-700">
                          {m.count}
                        </span>
                        <div
                          className="w-full rounded-t bg-emerald-400 transition-all"
                          style={{ height: `${Math.max((m.count / max) * 100, 4)}%` }}
                        />
                        <span className="text-[10px] text-stone-400 whitespace-nowrap">
                          {m.month}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top bookers */}
              {topBookers.length > 0 && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6">
                  <h2 className="text-sm font-semibold text-stone-900 mb-5">
                    Most Active Residents
                  </h2>
                  <div className="space-y-3">
                    {topBookers.map((b, i) => (
                      <div key={b.residentId}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-stone-700">
                            <span className="text-stone-400 mr-2">{i + 1}.</span>
                            {b.name}
                          </span>
                          <span className="text-sm font-semibold text-stone-900">
                            {b.bookings}
                          </span>
                        </div>
                        <Bar
                          value={b.bookings}
                          max={topBookers[0].bookings}
                          color="bg-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avg duration by amenity */}
              {avgDuration.length > 0 && (
                <div className="rounded-2xl border border-stone-200 bg-white p-6">
                  <h2 className="text-sm font-semibold text-stone-900 mb-5">
                    Avg Booking Duration
                  </h2>
                  <div className="space-y-3">
                    {avgDuration.map((a) => (
                      <div key={a.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-stone-600">{a.name}</span>
                          <span className="text-sm font-semibold text-stone-900">
                            {a.avgHours}h
                          </span>
                        </div>
                        <Bar
                          value={a.avgHours}
                          max={Math.max(...avgDuration.map((x) => x.avgHours), 1)}
                          color="bg-stone-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Status breakdown */}
            {Object.keys(bookingsByStatus).length > 0 && (
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h2 className="text-sm font-semibold text-stone-900 mb-4">
                  Booking Status Breakdown
                </h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(bookingsByStatus)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <span
                        key={status}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status] ?? 'bg-stone-100 text-stone-600'}`}
                      >
                        {status.replace(/_/g, ' ')} ({count})
                      </span>
                    ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </main>
  )
}
