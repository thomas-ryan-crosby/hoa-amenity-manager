'use client'

import { FormEvent, useState } from 'react'

type Staff = {
  id: string
  name: string
  email: string
  phone: string | null
  role: 'PROPERTY_MANAGER' | 'JANITORIAL'
}

type BlackoutDate = {
  id: string
  startDate: string
  endDate: string
  reason: string | null
  recurring: boolean
}

type Amenity = {
  id: string
  name: string
  description: string | null
  capacity: number
  rentalFee: number
  depositAmount: number
  calendarId: string
  requiresApproval: boolean
  autoApproveThreshold: number | null
  approverStaffId: string | null
  escalationHours: number
  fullRefundHours: number
  partialRefundHours: number
  partialRefundPercent: number
  maxAdvanceBookingDays: number
  janitorialAssignment: 'rotation' | 'manual'
  blackoutDates: BlackoutDate[]
}

const emptyAmenityForm = {
  name: '',
  description: '',
  capacity: 1,
  rentalFee: 0,
  depositAmount: 0,
  calendarId: '',
  requiresApproval: true,
  autoApproveThreshold: '',
  approverStaffId: '',
  escalationHours: 48,
  fullRefundHours: 72,
  partialRefundHours: 24,
  partialRefundPercent: 50,
  maxAdvanceBookingDays: 90,
  janitorialAssignment: 'rotation' as const,
}

type AmenityForm = {
  name: string
  description: string
  capacity: number
  rentalFee: number
  depositAmount: number
  calendarId: string
  requiresApproval: boolean
  autoApproveThreshold: string
  approverStaffId: string
  escalationHours: number
  fullRefundHours: number
  partialRefundHours: number
  partialRefundPercent: number
  maxAdvanceBookingDays: number
  janitorialAssignment: 'rotation' | 'manual'
}

function toAmenityForm(amenity: Amenity | null): AmenityForm {
  if (!amenity) {
    return { ...emptyAmenityForm }
  }

  return {
    name: amenity.name,
    description: amenity.description ?? '',
    capacity: amenity.capacity,
    rentalFee: amenity.rentalFee,
    depositAmount: amenity.depositAmount,
    calendarId: amenity.calendarId,
    requiresApproval: amenity.requiresApproval,
    autoApproveThreshold: amenity.autoApproveThreshold?.toString() ?? '',
    approverStaffId: amenity.approverStaffId ?? '',
    escalationHours: amenity.escalationHours,
    fullRefundHours: amenity.fullRefundHours,
    partialRefundHours: amenity.partialRefundHours,
    partialRefundPercent: amenity.partialRefundPercent,
    maxAdvanceBookingDays: amenity.maxAdvanceBookingDays,
    janitorialAssignment: amenity.janitorialAssignment,
  }
}

type SystemSettingsForm = {
  pmEmail: string
  orgName: string
  twilioPhoneNumber: string
}

type Props = {
  initialAmenities: Amenity[]
  initialStaff: Staff[]
  initialSettings?: SystemSettingsForm
}

export function AdminSettingsClient({ initialAmenities, initialStaff, initialSettings }: Props) {
  const [amenities, setAmenities] = useState<Amenity[]>(initialAmenities)
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [settingsForm, setSettingsForm] = useState<SystemSettingsForm>(
    initialSettings ?? { pmEmail: '', orgName: 'Sanctuary HOA', twilioPhoneNumber: '' },
  )
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null)
  const [amenityForm, setAmenityForm] = useState<AmenityForm>({
    ...emptyAmenityForm,
  })
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'JANITORIAL',
  })
  const [blackoutForm, setBlackoutForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    recurring: false,
  })
  const [chatMessage, setChatMessage] = useState('')
  const [chatReply, setChatReply] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const selectedAmenity =
    amenities.find((amenity) => amenity.id === selectedAmenityId) ?? null

  async function loadData() {
    const [amenitiesRes, staffRes] = await Promise.all([
      fetch('/api/admin/amenities'),
      fetch('/api/admin/staff'),
    ])

    const amenitiesData = await amenitiesRes.json()
    const staffData = await staffRes.json()

    setAmenities(amenitiesData.amenities ?? [])
    setStaff(staffData.staff ?? [])
  }

  function selectAmenity(amenity: Amenity | null) {
    setSelectedAmenityId(amenity?.id ?? null)
    setAmenityForm(toAmenityForm(amenity))
  }

  async function saveAmenity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = {
      name: amenityForm.name,
      description: amenityForm.description || null,
      capacity: Number(amenityForm.capacity),
      rentalFee: Number(amenityForm.rentalFee),
      depositAmount: Number(amenityForm.depositAmount),
      calendarId: amenityForm.calendarId,
      requiresApproval: amenityForm.requiresApproval,
      autoApproveThreshold: amenityForm.autoApproveThreshold
        ? Number(amenityForm.autoApproveThreshold)
        : null,
      approverStaffId: amenityForm.approverStaffId || null,
      escalationHours: Number(amenityForm.escalationHours),
      fullRefundHours: Number(amenityForm.fullRefundHours),
      partialRefundHours: Number(amenityForm.partialRefundHours),
      partialRefundPercent: Number(amenityForm.partialRefundPercent),
      maxAdvanceBookingDays: Number(amenityForm.maxAdvanceBookingDays),
      janitorialAssignment: amenityForm.janitorialAssignment,
    }

    const url = selectedAmenity
      ? `/api/admin/amenities/${selectedAmenity.id}`
      : '/api/admin/amenities'
    const method = selectedAmenity ? 'PUT' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (!response.ok) {
      setNotice(data.error ?? 'Unable to save amenity.')
      return
    }

    setNotice(selectedAmenity ? 'Amenity updated.' : 'Amenity created.')
    await loadData()
    if (!selectedAmenity) {
      setAmenityForm({ ...emptyAmenityForm })
    }
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
    await loadData()
  }

  async function addBlackoutDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedAmenity) {
      setNotice('Choose an amenity before adding blackout dates.')
      return
    }

    const response = await fetch(
      `/api/admin/amenities/${selectedAmenity.id}/blackout-dates`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: blackoutForm.startDate,
          endDate: blackoutForm.endDate,
          reason: blackoutForm.reason || null,
          recurring: blackoutForm.recurring,
        }),
      },
    )

    const data = await response.json()
    if (!response.ok) {
      setNotice(data.error ?? 'Unable to add blackout date.')
      return
    }

    setBlackoutForm({
      startDate: '',
      endDate: '',
      reason: '',
      recurring: false,
    })
    setNotice('Blackout date added.')
    await loadData()
  }

  async function sendConfigMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const response = await fetch('/api/admin/config-agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: chatMessage }),
    })

    const data = await response.json()
    if (!response.ok) {
      setChatReply(data.error ?? 'Unable to reach configuration agent.')
      return
    }

    setChatReply(data.message)
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

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Admin Settings
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-900">
            Amenities, staff, blackout dates, and configuration help
          </h1>
          <p className="mt-3 max-w-4xl text-base leading-7 text-stone-600">
            This screen now covers the main PRD-managed settings for amenities and
            staff, along with a lightweight configuration chat helper.
          </p>
        </div>

        {notice ? (
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Amenities</h2>
              <button
                className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700"
                onClick={() => selectAmenity(null)}
                type="button"
              >
                New
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {amenities.map((amenity) => (
                <button
                  key={amenity.id}
                  className={`w-full rounded-2xl px-4 py-3 text-left ${
                    selectedAmenityId === amenity.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-50 text-stone-700'
                  }`}
                  onClick={() => selectAmenity(amenity)}
                  type="button"
                >
                  <div className="font-medium">{amenity.name}</div>
                  <div className="text-xs opacity-80">
                    Fee ${amenity.rentalFee} • Deposit ${amenity.depositAmount}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">
              {selectedAmenity ? `Edit ${selectedAmenity.name}` : 'Create amenity'}
            </h2>

            <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={saveAmenity}>
              <label className="text-sm font-medium text-stone-700 md:col-span-2">
                Name
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                  value={amenityForm.name}
                  onChange={(event) =>
                    setAmenityForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>

              <label className="text-sm font-medium text-stone-700 md:col-span-2">
                Description
                <textarea
                  className="mt-2 min-h-24 w-full rounded-2xl border border-stone-300 px-4 py-3"
                  value={amenityForm.description}
                  onChange={(event) =>
                    setAmenityForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              {[
                ['Capacity', 'capacity'],
                ['Rental fee', 'rentalFee'],
                ['Deposit amount', 'depositAmount'],
                ['Escalation hours', 'escalationHours'],
                ['Full refund hours', 'fullRefundHours'],
                ['Partial refund hours', 'partialRefundHours'],
                ['Partial refund percent', 'partialRefundPercent'],
                ['Advance booking days', 'maxAdvanceBookingDays'],
              ].map(([label, key]) => (
                <label key={key} className="text-sm font-medium text-stone-700">
                  {label}
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                    type="number"
                    value={amenityForm[key as keyof typeof amenityForm] as number}
                    onChange={(event) =>
                      setAmenityForm((current) => ({
                        ...current,
                        [key]: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              ))}

              <label className="text-sm font-medium text-stone-700 md:col-span-2">
                Google Calendar ID
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                  value={amenityForm.calendarId}
                  onChange={(event) =>
                    setAmenityForm((current) => ({
                      ...current,
                      calendarId: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="text-sm font-medium text-stone-700">
                Auto-approve threshold
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                  type="number"
                  value={amenityForm.autoApproveThreshold}
                  onChange={(event) =>
                    setAmenityForm((current) => ({
                      ...current,
                      autoApproveThreshold: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="text-sm font-medium text-stone-700">
                Designated approver
                <select
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                  value={amenityForm.approverStaffId}
                  onChange={(event) =>
                    setAmenityForm((current) => ({
                      ...current,
                      approverStaffId: event.target.value,
                    }))
                  }
                >
                  <option value="">Default PM email</option>
                  {staff
                    .filter((member) => member.role === 'PROPERTY_MANAGER')
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
                <input
                  checked={amenityForm.requiresApproval}
                  onChange={(event) =>
                    setAmenityForm((current) => ({
                      ...current,
                      requiresApproval: event.target.checked,
                    }))
                  }
                  type="checkbox"
                />
                Requires approval
              </label>

              <label className="text-sm font-medium text-stone-700">
                Janitorial assignment
                <select
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                  value={amenityForm.janitorialAssignment}
                  onChange={(event) =>
                    setAmenityForm((current) => ({
                      ...current,
                      janitorialAssignment: event.target.value as 'rotation' | 'manual',
                    }))
                  }
                >
                  <option value="rotation">Rotation</option>
                  <option value="manual">Manual</option>
                </select>
              </label>

              <div className="md:col-span-2">
                <button
                  className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                  type="submit"
                >
                  {selectedAmenity ? 'Save changes' : 'Create amenity'}
                </button>
              </div>
            </form>

            <div className="mt-8 border-t border-stone-200 pt-6">
              <h3 className="text-lg font-semibold text-stone-900">Blackout dates</h3>

              <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={addBlackoutDate}>
                <label className="text-sm font-medium text-stone-700">
                  Start
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                    type="datetime-local"
                    value={blackoutForm.startDate}
                    onChange={(event) =>
                      setBlackoutForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="text-sm font-medium text-stone-700">
                  End
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                    type="datetime-local"
                    value={blackoutForm.endDate}
                    onChange={(event) =>
                      setBlackoutForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="text-sm font-medium text-stone-700 md:col-span-2">
                  Reason
                  <input
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3"
                    value={blackoutForm.reason}
                    onChange={(event) =>
                      setBlackoutForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 md:col-span-2">
                  <input
                    checked={blackoutForm.recurring}
                    onChange={(event) =>
                      setBlackoutForm((current) => ({
                        ...current,
                        recurring: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Repeat yearly
                </label>

                <div className="md:col-span-2">
                  <button
                    className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
                    type="submit"
                  >
                    Add blackout date
                  </button>
                </div>
              </form>

              <div className="mt-4 space-y-2">
                {(selectedAmenity?.blackoutDates ?? []).map((blackout) => (
                  <div
                    key={blackout.id}
                    className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700"
                  >
                    {new Date(blackout.startDate).toLocaleString()} -{' '}
                    {new Date(blackout.endDate).toLocaleString()}
                    {blackout.reason ? ` • ${blackout.reason}` : ''}
                    {blackout.recurring ? ' • recurring' : ''}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
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
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
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
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">Configuration agent</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Ask for current configuration summaries while we continue building
                out richer agent-managed edits.
              </p>
              <form className="mt-4 space-y-3" onSubmit={sendConfigMessage}>
                <textarea
                  className="min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                  placeholder='Try "list amenities" or "list staff"'
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                />
                <button
                  className="w-full rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
                  type="submit"
                >
                  Ask configuration agent
                </button>
              </form>
              {chatReply ? (
                <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
                  {chatReply}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
