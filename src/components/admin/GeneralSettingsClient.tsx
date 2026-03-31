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
  twilioPhoneNumber: string
}

type Props = {
  initialStaff: Staff[]
  initialSettings?: SystemSettingsForm
}

export function GeneralSettingsClient({ initialStaff, initialSettings }: Props) {
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [settingsForm, setSettingsForm] = useState<SystemSettingsForm>(
    initialSettings ?? { pmEmail: '', orgName: 'Sanctuary HOA', twilioPhoneNumber: '' },
  )
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'JANITORIAL',
  })
  const [notice, setNotice] = useState<string | null>(null)

  async function loadStaff() {
    const staffRes = await fetch('/api/admin/staff')
    const staffData = await staffRes.json()
    setStaff(staffData.staff ?? [])
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm),
    })

    if (!response.ok) {
      const data = await response.json()
      setNotice(data.error ?? 'Unable to save settings.')
      return
    }
    setNotice('System settings saved.')
  }

  async function saveStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const response = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...staffForm,
        phone: staffForm.phone || null,
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      setNotice(data.error ?? 'Unable to create staff member.')
      return
    }

    setStaffForm({
      name: '',
      email: '',
      phone: '',
      role: 'JANITORIAL',
    })
    setNotice('Staff member added.')
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
          <p className="mt-3 max-w-4xl text-base leading-7 text-stone-600">
            Configure organization details, notification settings, and manage
            staff members.
          </p>
        </div>

        {notice ? (
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        ) : null}

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
              <label className="block text-sm font-medium text-stone-700">
                Twilio phone number
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                  placeholder="+15551234567"
                  value={settingsForm.twilioPhoneNumber}
                  onChange={(e) => setSettingsForm((c) => ({ ...c, twilioPhoneNumber: e.target.value }))}
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
                  className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700"
                >
                  <div className="font-medium text-stone-900">{member.name}</div>
                  <div>{member.email}</div>
                  <div>{member.role}</div>
                </div>
              ))}
            </div>

            <form className="mt-5 space-y-3" onSubmit={saveStaff}>
              <input
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                placeholder="Name"
                value={staffForm.name}
                onChange={(event) =>
                  setStaffForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <input
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                placeholder="Email"
                type="email"
                value={staffForm.email}
                onChange={(event) =>
                  setStaffForm((current) => ({ ...current, email: event.target.value }))
                }
              />
              <input
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                placeholder="Phone"
                value={staffForm.phone}
                onChange={(event) =>
                  setStaffForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
              <select
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                value={staffForm.role}
                onChange={(event) =>
                  setStaffForm((current) => ({
                    ...current,
                    role: event.target.value as 'PROPERTY_MANAGER' | 'JANITORIAL',
                  }))
                }
              >
                <option value="JANITORIAL">Janitorial</option>
                <option value="PROPERTY_MANAGER">Property manager</option>
              </select>
              <button
                className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                type="submit"
              >
                Add staff member
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}
