'use client'

import { FormEvent, useEffect, useState } from 'react'

/* ── Types ─────────────────────────────────────────────── */

type Resident = {
  id: string
  name: string
  email: string
  phone: string | null
  unitNumber: string
  status: 'pending' | 'approved' | 'denied'
  createdAt: string
}

type Staff = {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'PROPERTY_MANAGER' | 'JANITORIAL'
}

type SystemSettingsForm = {
  pmEmail: string
  orgName: string
}

type Tab = 'residents' | 'staff' | 'settings'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  denied: 'bg-red-100 text-red-800',
}

/* ── Page ──────────────────────────────────────────────── */

export default function PeoplePage() {
  const [activeTab, setActiveTab] = useState<Tab>('residents')

  /* Residents state */
  const [residents, setResidents] = useState<Resident[]>([])
  const [residentsLoading, setResidentsLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')

  /* Staff state */
  const [staff, setStaff] = useState<Staff[]>([])
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', role: 'JANITORIAL' })
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)

  /* Settings state */
  const [settingsForm, setSettingsForm] = useState<SystemSettingsForm>({ pmEmail: '', orgName: 'Sanctuary HOA' })

  /* Shared notice */
  const [notice, setNotice] = useState<string | null>(null)

  /* ── Data loading ──────────────────────────────────── */

  async function loadResidents() {
    try {
      const res = await fetch('/api/admin/residents')
      const data = await res.json()
      setResidents(data.residents ?? [])
    } catch (err) {
      console.error('Failed to load residents', err)
    } finally {
      setResidentsLoading(false)
    }
  }

  async function loadStaff() {
    try {
      const res = await fetch('/api/admin/staff')
      const data = await res.json()
      setStaff(data.staff ?? [])
    } catch (err) {
      console.error('Failed to load staff', err)
    }
  }

  async function loadSettings() {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.settings) {
        setSettingsForm({
          pmEmail: data.settings.pmEmail ?? '',
          orgName: data.settings.orgName ?? 'Sanctuary HOA',
        })
      }
    } catch (err) {
      console.error('Failed to load settings', err)
    }
  }

  useEffect(() => {
    loadResidents()
    loadStaff()
    loadSettings()
  }, [])

  /* ── Resident actions ──────────────────────────────── */

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

  const filtered = filter === 'all' ? residents : residents.filter((r) => r.status === filter)
  const pendingCount = residents.filter((r) => r.status === 'pending').length

  /* ── Staff actions ─────────────────────────────────── */

  function startEditStaff(member: Staff) {
    setEditingStaffId(member.id)
    setStaffForm({
      name: member.name,
      email: member.email,
      phone: member.phone ?? '',
      role: member.role,
    })
  }

  function cancelEditStaff() {
    setEditingStaffId(null)
    setStaffForm({ name: '', email: '', phone: '', role: 'JANITORIAL' })
  }

  async function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = {
      name: staffForm.name,
      email: staffForm.email,
      phone: staffForm.phone || null,
      role: staffForm.role,
    }

    if (editingStaffId) {
      const res = await fetch(`/api/admin/staff/${editingStaffId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setNotice(data.error ?? 'Unable to update staff member.')
        return
      }
      setNotice('Staff member updated.')
      setEditingStaffId(null)
    } else {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json()
        setNotice(data.error ?? 'Unable to create staff member.')
        return
      }
      setNotice('Staff member added.')
    }

    setStaffForm({ name: '', email: '', phone: '', role: 'JANITORIAL' })
    await loadStaff()
  }

  async function deleteStaffMember(member: Staff) {
    if (!confirm(`Remove "${member.name}" from staff? This cannot be undone.`)) return

    const res = await fetch(`/api/admin/staff/${member.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setNotice(data.error ?? 'Unable to delete staff member.')
      return
    }
    setNotice(`"${member.name}" removed.`)
    if (editingStaffId === member.id) cancelEditStaff()
    await loadStaff()
  }

  /* ── Settings actions ──────────────────────────────── */

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    })
    if (!res.ok) {
      const data = await res.json()
      setNotice(data.error ?? 'Unable to save settings.')
      return
    }
    setNotice('System settings saved.')
  }

  /* ── Tab labels ────────────────────────────────────── */

  const tabs: { key: Tab; label: string }[] = [
    { key: 'residents', label: 'Residents' },
    { key: 'staff', label: 'Staff & Roles' },
    { key: 'settings', label: 'Settings' },
  ]

  /* ── Render ────────────────────────────────────────── */

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-900">People</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage residents, staff, and system settings
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              {tab.label}
              {tab.key === 'residents' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notice */}
        {notice && (
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        )}

        {/* ─── Tab: Residents ────────────────────────── */}
        {activeTab === 'residents' && (
          <>
            {residentsLoading ? (
              <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
            ) : (
              <>
                {/* Filter sub-tabs */}
                <div className="mb-4 flex gap-2">
                  {(['all', 'pending', 'approved', 'denied'] as const).map((f) => (
                    <button
                      key={f}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        filter === f
                          ? 'bg-stone-700 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
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
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[resident.status]}`}
                            >
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
              </>
            )}
          </>
        )}

        {/* ─── Tab: Staff & Roles ────────────────────── */}
        {activeTab === 'staff' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Staff list */}
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">Staff</h2>
              <div className="mt-4 space-y-2">
                {staff.length === 0 && (
                  <p className="text-sm text-stone-500">No staff members yet.</p>
                )}
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-start justify-between rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  >
                    <div>
                      <div className="font-medium text-stone-900">{member.name}</div>
                      <div>{member.email}</div>
                      <div className="text-xs text-stone-500">{member.role.replaceAll('_', ' ')}</div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        className="rounded-lg px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-200 hover:text-stone-700"
                        onClick={() => startEditStaff(member)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
                        onClick={() => deleteStaffMember(member)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Add / edit staff form */}
            <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">
                {editingStaffId ? 'Edit Staff Member' : 'Add Staff Member'}
              </h2>
              <form className="mt-4 space-y-3" onSubmit={saveStaff}>
                <input
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400"
                  placeholder="Name"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm((c) => ({ ...c, name: e.target.value }))}
                />
                <input
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400"
                  placeholder="Email"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm((c) => ({ ...c, email: e.target.value }))}
                />
                <input
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400"
                  placeholder="Phone (optional)"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm((c) => ({ ...c, phone: e.target.value }))}
                />
                <select
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
                  value={staffForm.role}
                  onChange={(e) =>
                    setStaffForm((c) => ({
                      ...c,
                      role: e.target.value as 'PROPERTY_MANAGER' | 'JANITORIAL',
                    }))
                  }
                >
                  <option value="JANITORIAL">Janitorial</option>
                  <option value="PROPERTY_MANAGER">Property manager</option>
                </select>
                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                    type="submit"
                  >
                    {editingStaffId ? 'Save changes' : 'Add staff member'}
                  </button>
                  {editingStaffId && (
                    <button
                      className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-600"
                      type="button"
                      onClick={cancelEditStaff}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        )}

        {/* ─── Tab: Settings ─────────────────────────── */}
        {activeTab === 'settings' && (
          <section className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">System Settings</h2>
            <form className="mt-4 space-y-3" onSubmit={saveSettings}>
              <label className="block text-sm font-medium text-stone-700">
                Organization name
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
                  value={settingsForm.orgName}
                  onChange={(e) => setSettingsForm((c) => ({ ...c, orgName: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                PM notification email
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900"
                  type="email"
                  placeholder="pm@yourhoa.org"
                  value={settingsForm.pmEmail}
                  onChange={(e) => setSettingsForm((c) => ({ ...c, pmEmail: e.target.value }))}
                />
              </label>
              <button
                className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                type="submit"
              >
                Save settings
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
