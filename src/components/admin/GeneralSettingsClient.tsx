'use client'

import { FormEvent, useState } from 'react'

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

type Props = {
  initialStaff: Staff[]
  initialSettings?: SystemSettingsForm
}

export function GeneralSettingsClient({ initialStaff, initialSettings }: Props) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [settingsForm, setSettingsForm] = useState<SystemSettingsForm>(
    initialSettings ?? { pmEmail: '', orgName: 'Sanctuary HOA' },
  )
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'JANITORIAL',
  })
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function loadStaff() {
    const res = await fetch('/api/admin/staff')
    const data = await res.json()
    setStaff(data.staff ?? [])
  }

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
      // Update existing
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
      // Create new
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

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            General Settings
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-900">
            System settings and staff management
          </h1>
        </div>

        {notice && (
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* System Settings */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">System Settings</h2>
            <form className="mt-4 space-y-3" onSubmit={saveSettings}>
              <label className="block text-sm font-medium text-stone-700">
                Organization name
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                  value={settingsForm.orgName}
                  onChange={(e) => setSettingsForm((c) => ({ ...c, orgName: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                PM notification email
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
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

          {/* Staff Management */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">Staff</h2>
            <div className="mt-4 space-y-2">
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

            <form className="mt-5 space-y-3" onSubmit={saveStaff}>
              <p className="text-sm font-medium text-stone-700">
                {editingStaffId ? 'Edit staff member' : 'Add staff member'}
              </p>
              <input
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm placeholder:text-stone-400"
                placeholder="Name"
                value={staffForm.name}
                onChange={(e) => setStaffForm((c) => ({ ...c, name: e.target.value }))}
              />
              <input
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm placeholder:text-stone-400"
                placeholder="Email"
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm((c) => ({ ...c, email: e.target.value }))}
              />
              <input
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm placeholder:text-stone-400"
                placeholder="Phone (optional)"
                value={staffForm.phone}
                onChange={(e) => setStaffForm((c) => ({ ...c, phone: e.target.value }))}
              />
              <select
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
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
      </div>
    </main>
  )
}
