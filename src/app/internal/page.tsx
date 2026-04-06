'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Community = {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  memberCount: number
  createdAt: string
}

type DashboardStats = {
  totalCommunities: number
  totalUsers: number
  totalBookings: number
}

export default function InternalDashboard() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalCommunities: 0,
    totalUsers: 0,
    totalBookings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/internal/communities')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load communities')
        return r.json()
      })
      .then((d) => {
        const list: Community[] = d.communities ?? []
        setCommunities(list)
        setStats({
          totalCommunities: list.length,
          totalUsers: list.reduce((sum: number, c: Community) => sum + c.memberCount, 0),
          totalBookings: d.totalBookings ?? 0,
        })
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-stone-200" />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-xl bg-stone-200" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error}
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">Total Communities</p>
                <p className="mt-1 text-2xl font-bold text-purple-700">
                  {stats.totalCommunities}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">Total Users</p>
                <p className="mt-1 text-2xl font-bold text-purple-700">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-5">
                <p className="text-sm text-stone-500">Total Bookings</p>
                <p className="mt-1 text-2xl font-bold text-purple-700">
                  {stats.totalBookings}
                </p>
              </div>
            </div>

            {/* Communities list */}
            <div className="rounded-xl border border-stone-200 bg-white">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <h2 className="font-semibold text-stone-900">Communities</h2>
                <Link
                  href="/internal/communities/new"
                  className="rounded-full bg-purple-700 px-4 py-2 text-sm font-medium text-white hover:bg-purple-800"
                >
                  Create Community
                </Link>
              </div>

              {communities.length === 0 ? (
                <div className="px-5 py-12 text-center text-stone-500">
                  No communities yet. Create your first one.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {communities.map((c) => (
                    <Link
                      key={c.id}
                      href={`/internal/communities/${c.id}`}
                      className="flex items-center justify-between px-5 py-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-stone-900 truncate">
                            {c.name}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              c.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-sm text-stone-500">
                          <span>/{c.slug}</span>
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                            {c.plan}
                          </span>
                          <span>{c.memberCount} members</span>
                        </div>
                      </div>
                      <svg
                        className="h-5 w-5 text-stone-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
