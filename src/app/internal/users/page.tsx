'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Membership = {
  id: string
  communityId: string
  role: string
  status: string
  unitNumber: string
  joinedAt: string
}

type User = {
  id: string
  firebaseUid: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  memberships: Membership[]
}

type CommunityName = { id: string; name: string }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [communities, setCommunities] = useState<CommunityName[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Fetch community names for display
  useEffect(() => {
    fetch('/api/internal/communities')
      .then((r) => r.json())
      .then((d) => {
        setCommunities(
          (d.communities ?? []).map((c: { id: string; name: string }) => ({
            id: c.id,
            name: c.name,
          })),
        )
      })
      .catch(() => {})
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (search) params.set('q', search)
      const res = await fetch(`/api/internal/users?${params}`)
      if (!res.ok) throw new Error('Failed to load users')
      const d = await res.json()
      setUsers(d.users ?? [])
      setTotal(d.total ?? 0)
      setTotalPages(d.totalPages ?? 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  function communityName(id: string) {
    return communities.find((c) => c.id === id)?.name ?? id.slice(0, 8) + '...'
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      property_manager: 'bg-purple-50 text-purple-700',
      janitorial: 'bg-blue-50 text-blue-700',
      board: 'bg-amber-50 text-amber-700',
      resident: 'bg-stone-100 text-stone-600',
    }
    return colors[role] ?? 'bg-stone-100 text-stone-600'
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      approved: 'bg-emerald-50 text-emerald-700',
      pending: 'bg-yellow-50 text-yellow-700',
      denied: 'bg-red-50 text-red-700',
    }
    return colors[status] ?? 'bg-stone-100 text-stone-500'
  }

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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/internal"
              className="text-sm text-purple-700 hover:text-purple-900"
            >
              &larr; Back to dashboard
            </Link>
            <h2 className="mt-2 text-xl font-bold text-stone-900">
              All Users ({total})
            </h2>
          </div>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or Firebase UID..."
              className="flex-1 rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="rounded-xl bg-purple-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-800"
            >
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPage(1)
                }}
                className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-600 hover:bg-stone-50"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Users list */}
        <div className="rounded-xl border border-stone-200 bg-white">
          {loading ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-stone-100"
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="px-5 py-12 text-center text-stone-500">
              {search ? 'No users match your search.' : 'No users found.'}
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {users.map((u) => (
                <div key={u.id}>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === u.id ? null : u.id)
                    }
                    className="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-stone-50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-stone-900 truncate">
                          {u.name || '(no name)'}
                        </p>
                        {u.memberships.length > 0 && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-700">
                            {u.memberships.length}{' '}
                            {u.memberships.length === 1
                              ? 'community'
                              : 'communities'}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-stone-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                      <svg
                        className={`h-4 w-4 text-stone-400 transition-transform ${
                          expandedId === u.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expandedId === u.id && (
                    <div className="border-t border-stone-100 bg-stone-50 px-5 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
                        <div>
                          <p className="text-stone-400">Firebase UID</p>
                          <p className="mt-0.5 font-mono text-stone-700 break-all">
                            {u.firebaseUid}
                          </p>
                        </div>
                        <div>
                          <p className="text-stone-400">Phone</p>
                          <p className="mt-0.5 text-stone-700">
                            {u.phone ?? '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-stone-400">Resident ID</p>
                          <p className="mt-0.5 font-mono text-stone-700">
                            {u.id}
                          </p>
                        </div>
                        <div>
                          <p className="text-stone-400">Registered</p>
                          <p className="mt-0.5 text-stone-700">
                            {new Date(u.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {u.memberships.length === 0 ? (
                        <p className="text-xs text-stone-400">
                          Not a member of any community.
                        </p>
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-stone-600 mb-2">
                            Community Memberships
                          </p>
                          <div className="space-y-2">
                            {u.memberships.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/internal/communities/${m.communityId}`}
                                    className="text-sm font-medium text-purple-700 hover:text-purple-900"
                                  >
                                    {communityName(m.communityId)}
                                  </Link>
                                  {m.unitNumber && (
                                    <span className="text-xs text-stone-400">
                                      Unit {m.unitNumber}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs font-medium ${roleBadge(m.role)}`}
                                  >
                                    {m.role.replace('_', ' ')}
                                  </span>
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(m.status)}`}
                                  >
                                    {m.status}
                                  </span>
                                  <span className="text-xs text-stone-400">
                                    Joined{' '}
                                    {new Date(m.joinedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-stone-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
