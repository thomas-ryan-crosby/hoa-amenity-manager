'use client'

import { FormEvent, useEffect, useState } from 'react'

type Resident = {
  id: string
  name: string
  email: string
  phone: string | null
  unitNumber: string
  status: 'pending' | 'approved' | 'denied'
  role: string
  createdAt: string
}

type SystemSettings = {
  pmEmail: string
  orgName: string
}

type Invite = {
  id: string
  code: string
  useCount: number
  maxUses: number | null
  isActive: boolean
  createdAt: string
  expiresAt: string | null
}

const ROLE_OPTIONS = [
  { value: 'resident', label: 'Resident' },
  { value: 'property_manager', label: 'Property Manager' },
  { value: 'janitorial', label: 'Janitorial' },
  { value: 'board', label: 'Board Member' },
]

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-800',
}

export default function PeoplePage() {
  const [residents, setResidents] = useState<Resident[]>([])
  const [settings, setSettings] = useState<SystemSettings>({ pmEmail: '', orgName: '' })
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')
  const [tab, setTab] = useState<'people' | 'settings'>('people')
  const [newInviteMaxUses, setNewInviteMaxUses] = useState('')
  const [newInviteCode, setNewInviteCode] = useState('')
  const [creatingInvite, setCreatingInvite] = useState(false)

  async function loadData() {
    try {
      const [resRes, setRes, invRes] = await Promise.all([
        fetch('/api/admin/residents'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/invites'),
      ])
      const resData = await resRes.json()
      const setData = await setRes.json()
      const invData = await invRes.json()
      setResidents(resData.residents ?? [])
      setSettings(setData.settings ?? { pmEmail: '', orgName: '' })
      setInvites(invData.invites ?? [])
    } catch (err) {
      console.error('Failed to load data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function updateStatus(id: string, status: 'approved' | 'denied') {
    setBusy(id)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/residents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setNotice(status === 'approved' ? 'Resident approved.' : 'Resident denied.')
        await loadData()
      }
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setBusy(null)
    }
  }

  async function changeRole(id: string, role: string) {
    setBusy(id)
    setNotice(null)
    try {
      const res = await fetch(`/api/admin/residents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (res.ok) {
        setResidents((prev) => prev.map((r) => r.id === id ? { ...r, role } : r))
        setNotice('Role updated.')
      }
    } catch (err) {
      console.error('Failed to update role', err)
    } finally {
      setBusy(null)
    }
  }

  async function saveSettings(e: FormEvent) {
    e.preventDefault()
    setNotice(null)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) setNotice('Settings saved.')
  }

  async function createInvite(e: FormEvent) {
    e.preventDefault()
    setCreatingInvite(true)
    setNotice(null)
    try {
      const payload: Record<string, unknown> = {}
      if (newInviteCode.trim()) payload.code = newInviteCode.trim()
      if (newInviteMaxUses.trim()) payload.maxUses = parseInt(newInviteMaxUses, 10)

      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setNewInviteCode('')
        setNewInviteMaxUses('')
        setNotice('Invite code created.')
        await loadData()
      }
    } catch (err) {
      console.error('Failed to create invite', err)
    } finally {
      setCreatingInvite(false)
    }
  }

  async function deactivateInvite(inviteId: string) {
    setBusy(inviteId)
    try {
      const res = await fetch(`/api/admin/invites/${inviteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      })
      if (res.ok) {
        setNotice('Invite deactivated.')
        await loadData()
      }
    } catch (err) {
      console.error('Failed to deactivate invite', err)
    } finally {
      setBusy(null)
    }
  }

  const filtered = filter === 'all' ? residents : residents.filter((r) => r.status === filter)
  const pendingCount = residents.filter((r) => r.status === 'pending').length

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Administration
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-stone-900">
            People & Settings
          </h1>
        </div>

        {notice && (
          <div className="mb-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        )}

        {/* Top tabs */}
        <div className="mb-5 flex gap-2">
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              tab === 'people' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
            onClick={() => setTab('people')}
            type="button"
          >
            People
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            className={`rounded-full px-5 py-2 text-sm font-medium transition ${
              tab === 'settings' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
            onClick={() => setTab('settings')}
            type="button"
          >
            Settings
          </button>
        </div>

        {tab === 'people' && (
          <>
            {/* Status filter */}
            <div className="mb-4 flex flex-wrap gap-2">
              {(['all', 'pending', 'approved', 'denied'] as const).map((f) => (
                <button
                  key={f}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    filter === f
                      ? 'bg-stone-700 text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  onClick={() => setFilter(f)}
                  type="button"
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'pending' && pendingCount > 0 && (
                    <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* People list */}
            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                  No people match this filter.
                </div>
              )}

              {filtered.map((person) => (
                <div
                  key={person.id}
                  className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-stone-900">{person.name}</h3>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[person.status]}`}>
                          {person.status}
                        </span>
                        {person.status === 'approved' && person.role !== 'resident' && (
                          <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-xs font-semibold text-white">
                            {person.role.replaceAll('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-stone-600 break-all">{person.email}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-500">
                        {person.unitNumber && <span>Unit: {person.unitNumber}</span>}
                        {person.phone && <span>Phone: {person.phone}</span>}
                        <span>Joined: {new Date(person.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Approve / Deny for pending */}
                      {person.status === 'pending' && (
                        <>
                          <button
                            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-emerald-300"
                            disabled={busy === person.id}
                            onClick={() => updateStatus(person.id, 'approved')}
                            type="button"
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            disabled={busy === person.id}
                            onClick={() => updateStatus(person.id, 'denied')}
                            type="button"
                          >
                            Deny
                          </button>
                        </>
                      )}

                      {/* Re-approve for denied */}
                      {person.status === 'denied' && (
                        <button
                          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-emerald-300"
                          disabled={busy === person.id}
                          onClick={() => updateStatus(person.id, 'approved')}
                          type="button"
                        >
                          Approve
                        </button>
                      )}

                      {/* Role selector for approved */}
                      {person.status === 'approved' && (
                        <select
                          className="w-full sm:w-auto rounded-full border border-stone-300 px-3 py-2 text-sm text-stone-900"
                          value={person.role}
                          onChange={(e) => changeRole(person.id, e.target.value)}
                          disabled={busy === person.id}
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'settings' && (
          <div className="space-y-6">
            {/* System Settings */}
            <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">System Settings</h2>
              <form className="mt-4 space-y-4" onSubmit={saveSettings}>
                <label className="block text-sm font-medium text-stone-700">
                  Organization name
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
                    value={settings.orgName}
                    onChange={(e) => setSettings((s) => ({ ...s, orgName: e.target.value }))}
                  />
                </label>
                <label className="block text-sm font-medium text-stone-700">
                  PM notification email
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400"
                    type="email"
                    placeholder="pm@yourhoa.org"
                    value={settings.pmEmail}
                    onChange={(e) => setSettings((s) => ({ ...s, pmEmail: e.target.value }))}
                  />
                </label>
                <button
                  className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                  type="submit"
                >
                  Save settings
                </button>
              </form>
            </div>

            {/* Invite Codes */}
            <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">Invite Codes</h2>
              <p className="mt-1 text-sm text-stone-500">
                Share invite codes with residents so they can join this community.
              </p>

              {/* Create new invite */}
              <form className="mt-4 space-y-3" onSubmit={createInvite}>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded-2xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 uppercase placeholder:normal-case placeholder:text-stone-400"
                    placeholder="Custom code (optional)"
                    value={newInviteCode}
                    onChange={(e) => setNewInviteCode(e.target.value)}
                  />
                  <input
                    className="w-24 rounded-2xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400"
                    type="number"
                    min="1"
                    placeholder="Max uses"
                    value={newInviteMaxUses}
                    onChange={(e) => setNewInviteMaxUses(e.target.value)}
                  />
                </div>
                <button
                  className="w-full rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
                  type="submit"
                  disabled={creatingInvite}
                >
                  {creatingInvite ? 'Creating...' : 'Create invite code'}
                </button>
              </form>

              {/* Existing invites */}
              {invites.length > 0 && (
                <div className="mt-5 space-y-2">
                  {invites.map((inv) => (
                    <div
                      key={inv.id}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                        inv.isActive
                          ? 'border-stone-200 bg-stone-50'
                          : 'border-stone-100 bg-stone-50/50 opacity-60'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-sm font-semibold text-stone-900 tracking-wider">
                          {inv.code}
                        </span>
                        <div className="mt-0.5 text-xs text-stone-500">
                          {inv.useCount} uses{inv.maxUses !== null ? ` / ${inv.maxUses} max` : ''}
                          {!inv.isActive && (
                            <span className="ml-2 text-red-500 font-medium">Inactive</span>
                          )}
                        </div>
                      </div>
                      {inv.isActive && (
                        <button
                          className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-50"
                          onClick={() => deactivateInvite(inv.id)}
                          disabled={busy === inv.id}
                          type="button"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {invites.length === 0 && (
                <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
                  No invite codes yet. Create one above.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
