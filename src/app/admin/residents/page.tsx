'use client'

import { useEffect, useState } from 'react'

type Resident = {
  id: string
  name: string
  email: string
  phone: string | null
  unitNumber: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-800',
}

export default function ResidentsPage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')

  async function loadResidents() {
    try {
      const res = await fetch('/api/admin/residents')
      const data = await res.json()
      setResidents(data.residents ?? [])
    } catch (err) {
      console.error('Failed to load residents', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResidents()
  }, [])

  async function updateStatus(id: string, status: 'approved' | 'denied') {
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/residents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) await loadResidents()
    } catch (err) {
      console.error('Failed to update resident', err)
    } finally {
      setBusy(null)
    }
  }

  async function changeRole(id: string, role: string) {
    setBusy(id)
    try {
      await fetch(`/api/admin/residents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
    } catch (err) {
      console.error('Failed to update role', err)
    } finally {
      setBusy(null)
    }
  }

  const filtered = filter === 'all'
    ? residents
    : residents.filter((r) => r.status === filter)

  const pendingCount = residents.filter((r) => r.status === 'pending').length

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Resident Management
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-900">
            Residents
            {pendingCount > 0 && (
              <span className="ml-3 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                {pendingCount} pending
              </span>
            )}
          </h1>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex gap-2">
          {(['all', 'pending', 'approved', 'denied'] as const).map((f) => (
            <button
              key={f}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === f
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              onClick={() => setFilter(f)}
              type="button"
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Resident list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
              No residents match this filter.
            </div>
          )}

          {filtered.map((resident) => (
            <div
              key={resident.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-stone-900">{resident.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[resident.status]}`}>
                      {resident.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">{resident.email}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-500">
                    {resident.unitNumber && <span>Unit: {resident.unitNumber}</span>}
                    {resident.phone && <span>Phone: {resident.phone}</span>}
                    <span>Signed up: {new Date(resident.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {resident.status === 'pending' && (
                    <>
                      <button
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-emerald-300"
                        disabled={busy === resident.id}
                        onClick={() => updateStatus(resident.id, 'approved')}
                        type="button"
                      >
                        Approve
                      </button>
                      <button
                        className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        disabled={busy === resident.id}
                        onClick={() => updateStatus(resident.id, 'denied')}
                        type="button"
                      >
                        Deny
                      </button>
                    </>
                  )}
                  {resident.status === 'denied' && (
                    <button
                      className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-emerald-300"
                      disabled={busy === resident.id}
                      onClick={() => updateStatus(resident.id, 'approved')}
                      type="button"
                    >
                      Approve
                    </button>
                  )}
                  {resident.status === 'approved' && (
                    <select
                      className="rounded-full border border-stone-300 px-3 py-2 text-sm text-stone-900"
                      defaultValue="resident"
                      onChange={(e) => changeRole(resident.id, e.target.value)}
                    >
                      <option value="resident">Resident</option>
                      <option value="property_manager">Property Manager</option>
                      <option value="janitorial">Janitorial</option>
                      <option value="board">Board Member</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
