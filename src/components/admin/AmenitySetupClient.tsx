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
  requiresApproval: boolean
  autoApproveThreshold: number | null
  approverStaffId: string | null
  escalationHours: number
  fullRefundHours: number
  partialRefundHours: number
  partialRefundPercent: number
  maxAdvanceBookingDays: number
  janitorialAssignment: 'rotation' | 'manual' | 'none'
  defaultTurnTimeHours: number
  parentAmenityId: string | null
  childAmenityIds: string[]
  blackoutDates: BlackoutDate[]
}

type AmenityForm = {
  name: string
  description: string
  capacity: number
  isPaid: boolean
  requiresJanitorial: boolean
  rentalFee: number
  depositAmount: number
  requiresApproval: boolean
  autoApproveThreshold: string
  approverStaffId: string
  escalationHours: number
  fullRefundHours: number
  partialRefundHours: number
  partialRefundPercent: number
  maxAdvanceBookingDays: number
  janitorialAssignment: 'rotation' | 'manual' | 'none'
  defaultTurnTimeHours: number
  parentAmenityId: string
}

const emptyAmenityForm: AmenityForm = {
  name: '',
  description: '',
  capacity: 1,
  isPaid: true,
  requiresJanitorial: true,
  rentalFee: 0,
  depositAmount: 0,
  requiresApproval: true,
  autoApproveThreshold: '',
  approverStaffId: '',
  escalationHours: 48,
  fullRefundHours: 72,
  partialRefundHours: 24,
  partialRefundPercent: 50,
  maxAdvanceBookingDays: 90,
  janitorialAssignment: 'rotation' as const,
  defaultTurnTimeHours: 0,
  parentAmenityId: '',
}

function toAmenityForm(amenity: Amenity | null): AmenityForm {
  if (!amenity) return { ...emptyAmenityForm }
  return {
    name: amenity.name,
    description: amenity.description ?? '',
    capacity: amenity.capacity,
    isPaid: amenity.rentalFee > 0 || amenity.depositAmount > 0,
    requiresJanitorial: amenity.janitorialAssignment !== 'none',
    rentalFee: amenity.rentalFee,
    depositAmount: amenity.depositAmount,
    requiresApproval: amenity.requiresApproval,
    autoApproveThreshold: amenity.autoApproveThreshold?.toString() ?? '',
    approverStaffId: amenity.approverStaffId ?? '',
    escalationHours: amenity.escalationHours,
    fullRefundHours: amenity.fullRefundHours,
    partialRefundHours: amenity.partialRefundHours,
    partialRefundPercent: amenity.partialRefundPercent,
    maxAdvanceBookingDays: amenity.maxAdvanceBookingDays,
    janitorialAssignment: amenity.janitorialAssignment,
    defaultTurnTimeHours: amenity.defaultTurnTimeHours ?? 0,
    parentAmenityId: amenity.parentAmenityId ?? '',
  }
}

// ---------------------------------------------------------------------------
// Info tooltip component
// ---------------------------------------------------------------------------
function Info({ tip }: { tip: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative ml-1.5 inline-block">
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold leading-none text-stone-500 hover:bg-stone-300"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        aria-label="More info"
      >
        i
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-xl bg-stone-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg">
          {tip}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-stone-900" />
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Toggle switch component
// ---------------------------------------------------------------------------
function Toggle({
  checked,
  onChange,
  label,
  tip,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  tip: string
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-stone-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5.5 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </button>
      {label}
      <Info tip={tip} />
    </label>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type Props = {
  initialAmenities: Amenity[]
  initialStaff: Staff[]
}

export function AmenitySetupClient({ initialAmenities, initialStaff }: Props) {
  const [amenities, setAmenities] = useState<Amenity[]>(initialAmenities)
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null)
  const [amenityForm, setAmenityForm] = useState<AmenityForm>({ ...emptyAmenityForm })
  const [blackoutForm, setBlackoutForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    recurring: false,
  })
  const [chatMessage, setChatMessage] = useState('')
  const [chatReply, setChatReply] = useState('')
  const [notice, setNotice] = useState<string | null>(null)

  const selectedAmenity = amenities.find((a) => a.id === selectedAmenityId) ?? null
  const f = amenityForm
  const set = (patch: Partial<AmenityForm>) =>
    setAmenityForm((c) => ({ ...c, ...patch }))

  async function loadData() {
    const [aRes, sRes] = await Promise.all([
      fetch('/api/admin/amenities'),
      fetch('/api/admin/staff'),
    ])
    const aData = await aRes.json()
    const sData = await sRes.json()
    setAmenities(aData.amenities ?? [])
    setStaff(sData.staff ?? [])
  }

  function selectAmenity(amenity: Amenity | null) {
    setSelectedAmenityId(amenity?.id ?? null)
    setAmenityForm(toAmenityForm(amenity))
  }

  async function saveAmenity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      name: f.name,
      description: f.description || null,
      capacity: Number(f.capacity),
      rentalFee: f.isPaid ? Number(f.rentalFee) : 0,
      depositAmount: f.isPaid ? Number(f.depositAmount) : 0,
      requiresApproval: f.requiresApproval,
      autoApproveThreshold: f.requiresApproval && f.autoApproveThreshold
        ? Number(f.autoApproveThreshold)
        : null,
      approverStaffId: f.requiresApproval && f.approverStaffId ? f.approverStaffId : null,
      escalationHours: f.requiresApproval ? Number(f.escalationHours) : 48,
      fullRefundHours: f.isPaid ? Number(f.fullRefundHours) : 0,
      partialRefundHours: f.isPaid ? Number(f.partialRefundHours) : 0,
      partialRefundPercent: f.isPaid ? Number(f.partialRefundPercent) : 0,
      maxAdvanceBookingDays: Number(f.maxAdvanceBookingDays),
      janitorialAssignment: f.requiresJanitorial ? f.janitorialAssignment : 'none',
      defaultTurnTimeHours: f.requiresJanitorial ? Number(f.defaultTurnTimeHours) : 0,
      parentAmenityId: f.parentAmenityId || null,
    }

    const url = selectedAmenity ? `/api/admin/amenities/${selectedAmenity.id}` : '/api/admin/amenities'
    const method = selectedAmenity ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setNotice(data.error ?? 'Unable to save amenity.'); return }
    setNotice(selectedAmenity ? 'Amenity updated.' : 'Amenity created.')
    await loadData()
    if (!selectedAmenity) setAmenityForm({ ...emptyAmenityForm })
  }

  async function deleteSelectedAmenity() {
    if (!selectedAmenity) return
    if (!confirm(`Delete "${selectedAmenity.name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/admin/amenities/${selectedAmenity.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      setNotice(data.error ?? 'Unable to delete amenity.')
      return
    }
    setNotice(`"${selectedAmenity.name}" deleted.`)
    setSelectedAmenityId(null)
    setAmenityForm({ ...emptyAmenityForm })
    await loadData()
  }

  async function addBlackoutDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedAmenity) { setNotice('Choose an amenity first.'); return }
    const res = await fetch(`/api/admin/amenities/${selectedAmenity.id}/blackout-dates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: blackoutForm.startDate,
        endDate: blackoutForm.endDate,
        reason: blackoutForm.reason || null,
        recurring: blackoutForm.recurring,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setNotice(data.error ?? 'Unable to add blackout date.'); return }
    setBlackoutForm({ startDate: '', endDate: '', reason: '', recurring: false })
    setNotice('Blackout date added.')
    await loadData()
  }

  async function sendConfigMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const res = await fetch('/api/admin/config-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: chatMessage }),
    })
    const data = await res.json()
    setChatReply(!res.ok ? (data.error ?? 'Unable to reach configuration agent.') : data.message)
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Amenity Setup</p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-900">Amenities, policies, and blackout dates</h1>
        </div>

        {notice && (
          <div className="mb-6 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          {/* ---- LEFT: amenity list ---- */}
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
              {amenities.map((a) => (
                <button
                  key={a.id}
                  className={`w-full rounded-2xl px-4 py-3 text-left ${
                    selectedAmenityId === a.id ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-700'
                  }`}
                  onClick={() => selectAmenity(a)}
                  type="button"
                >
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs opacity-80">
                    {a.rentalFee > 0 ? `$${a.rentalFee} + $${a.depositAmount} deposit` : 'Free'}
                    {a.requiresApproval ? ' • Approval required' : ' • Auto-approved'}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ---- CENTER: form ---- */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-900">
              {selectedAmenity ? `Edit ${selectedAmenity.name}` : 'Create amenity'}
            </h2>

            <form className="mt-5 space-y-5" onSubmit={saveAmenity}>
              {/* -- Basic info -- */}
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-stone-700 md:col-span-2">
                  Name <Info tip="The public-facing name residents see when booking." />
                  <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" value={f.name} onChange={(e) => set({ name: e.target.value })} />
                </label>

                <label className="text-sm font-medium text-stone-700 md:col-span-2">
                  Description <Info tip="A short description shown to residents during booking. Include capacity info, rules, or what's included." />
                  <textarea className="mt-2 min-h-20 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" value={f.description} onChange={(e) => set({ description: e.target.value })} />
                </label>

                <label className="text-sm font-medium text-stone-700">
                  Max capacity <Info tip="Maximum number of guests allowed. Booking requests exceeding this are rejected." />
                  <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" type="number" min={1} value={f.capacity} onChange={(e) => set({ capacity: Number(e.target.value) })} />
                </label>

                <label className="text-sm font-medium text-stone-700">
                  Advance booking window <Info tip="How many days in advance residents can book. E.g. 90 means they can book up to 3 months out." />
                  <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" type="number" min={1} value={f.maxAdvanceBookingDays} onChange={(e) => set({ maxAdvanceBookingDays: Number(e.target.value) })} />
                </label>
              </div>

              {/* -- Paid toggle -- */}
              <div className="border-t border-stone-200 pt-5">
                <Toggle
                  checked={f.isPaid}
                  onChange={(v) => set({ isPaid: v })}
                  label="Paid amenity"
                  tip="When enabled, residents pay a rental fee and security deposit via Stripe. When disabled, the amenity is free to book."
                />
              </div>

              {f.isPaid && (
                <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-stone-700">
                    Rental fee ($) <Info tip="The base fee charged to the resident for each booking." />
                    <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={0} step="0.01" value={f.rentalFee} onChange={(e) => set({ rentalFee: Number(e.target.value) })} />
                  </label>

                  <label className="text-sm font-medium text-stone-700">
                    Security deposit ($) <Info tip="A refundable deposit held until after the event. Released automatically if the post-event inspection passes." />
                    <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={0} step="0.01" value={f.depositAmount} onChange={(e) => set({ depositAmount: Number(e.target.value) })} />
                  </label>

                  <h4 className="text-sm font-semibold text-stone-800 md:col-span-2">
                    Cancellation policy <Info tip="Controls how refunds work when a resident cancels their booking." />
                  </h4>

                  <label className="text-sm font-medium text-stone-700">
                    Full refund if cancelled (hours before) <Info tip="Residents get 100% back if they cancel at least this many hours before the event." />
                    <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={0} value={f.fullRefundHours} onChange={(e) => set({ fullRefundHours: Number(e.target.value) })} />
                  </label>

                  <label className="text-sm font-medium text-stone-700">
                    Partial refund if cancelled (hours before) <Info tip="Residents get a partial refund if they cancel between this time and the full-refund window." />
                    <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={0} value={f.partialRefundHours} onChange={(e) => set({ partialRefundHours: Number(e.target.value) })} />
                  </label>

                  <label className="text-sm font-medium text-stone-700">
                    Partial refund percent <Info tip="The percentage refunded during the partial refund window. E.g. 50 means they get half back." />
                    <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={0} max={100} value={f.partialRefundPercent} onChange={(e) => set({ partialRefundPercent: Number(e.target.value) })} />
                  </label>
                </div>
              )}

              {/* -- Approval toggle -- */}
              <div className="border-t border-stone-200 pt-5">
                <Toggle
                  checked={f.requiresApproval}
                  onChange={(v) => set({ requiresApproval: v })}
                  label="Requires PM approval"
                  tip="When enabled, a property manager must approve each booking before the resident is asked to pay. When disabled, bookings are auto-approved."
                />
              </div>

              {f.requiresApproval && (
                <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 md:grid-cols-2">
                  <label className="text-sm font-medium text-stone-700">
                    Auto-approve if guests under <Info tip="Bookings with fewer guests than this number are automatically approved, skipping PM review. Leave blank to always require approval." />
                    <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={1} placeholder="Always require approval" value={f.autoApproveThreshold} onChange={(e) => set({ autoApproveThreshold: e.target.value })} />
                  </label>

                  <label className="text-sm font-medium text-stone-700">
                    Designated approver <Info tip="Which property manager receives the approval request email. Falls back to the PM email in General Settings." />
                    <select className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" value={f.approverStaffId} onChange={(e) => set({ approverStaffId: e.target.value })}>
                      <option value="">Default PM email</option>
                      {staff.filter((m) => m.role === 'PROPERTY_MANAGER').map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium text-stone-700">
                    Escalation timeout (hours) <Info tip="If the approver doesn't respond within this many hours, the request escalates to the default PM email." />
                    <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={1} value={f.escalationHours} onChange={(e) => set({ escalationHours: Number(e.target.value) })} />
                  </label>
                </div>
              )}

              {/* -- Janitorial toggle -- */}
              <div className="border-t border-stone-200 pt-5">
                <Toggle
                  checked={f.requiresJanitorial}
                  onChange={(v) => set({ requiresJanitorial: v })}
                  label="Requires janitorial"
                  tip="When enabled, janitorial staff are automatically assigned for pre-event setup and post-event inspection. When disabled, no janitorial work is scheduled."
                />
              </div>

              {f.requiresJanitorial && (
                <div className="space-y-4 rounded-2xl bg-stone-50 p-4">
                  <label className="text-sm font-medium text-stone-700">
                    Assignment mode <Info tip="Rotation: automatically assigns the next available janitor in a round-robin based on recent workload. Manual: the PM assigns janitorial staff from the dashboard." />
                    <select className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" value={f.janitorialAssignment} onChange={(e) => set({ janitorialAssignment: e.target.value as 'rotation' | 'manual' | 'none' })}>
                      <option value="rotation">Automatic rotation</option>
                      <option value="manual">Manual assignment by PM</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium text-stone-700">
                    Default turn time <Info tip="How long the amenity is blocked after an event for cleaning and inspection. Janitorial staff can adjust the actual cleaning window on their calendar." />
                    <select className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" value={f.defaultTurnTimeHours} onChange={(e) => set({ defaultTurnTimeHours: Number(e.target.value) })}>
                      <option value="0">No turn time</option>
                      <option value="4">4 hours</option>
                      <option value="8">8 hours</option>
                      <option value="12">12 hours</option>
                      <option value="24">24 hours (1 day)</option>
                      <option value="48">48 hours (2 days)</option>
                      <option value="72">72 hours (3 days)</option>
                    </select>
                  </label>
                </div>
              )}

              {/* -- Linked amenities -- */}
              <div className="border-t border-stone-200 pt-5">
                <label className="text-sm font-medium text-stone-700">
                  Parent amenity <Info tip="If this amenity is a sub-area of another (e.g. Pickleball Court is inside Tennis Court 3), select the parent. Booking either one blocks the other automatically." />
                  <select
                    className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900"
                    value={f.parentAmenityId}
                    onChange={(e) => set({ parentAmenityId: e.target.value })}
                  >
                    <option value="">None (standalone amenity)</option>
                    {amenities
                      .filter((a) => a.id !== selectedAmenity?.id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                  </select>
                </label>

                {selectedAmenity && selectedAmenity.childAmenityIds?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-stone-700">Sub-areas of this amenity:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedAmenity.childAmenityIds.map((childId) => {
                        const child = amenities.find((a) => a.id === childId)
                        return child ? (
                          <span key={childId} className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                            {child.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {selectedAmenity?.parentAmenityId && (
                  <p className="mt-2 text-xs text-stone-500">
                    Linked to: {amenities.find((a) => a.id === selectedAmenity.parentAmenityId)?.name ?? 'Unknown'}.
                    Booking either one blocks the other.
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white" type="submit">
                  {selectedAmenity ? 'Save changes' : 'Create amenity'}
                </button>
                {selectedAmenity && (
                  <button
                    className="rounded-full border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                    type="button"
                    onClick={deleteSelectedAmenity}
                  >
                    Delete amenity
                  </button>
                )}
              </div>
            </form>

            {/* ---- Blackout dates ---- */}
            <div className="mt-8 border-t border-stone-200 pt-6">
              <h3 className="text-lg font-semibold text-stone-900">
                Blackout dates <Info tip="Dates when this amenity cannot be booked. Use for holidays, maintenance, or HOA events. Recurring dates repeat every year." />
              </h3>

              <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={addBlackoutDate}>
                <label className="text-sm font-medium text-stone-700">
                  Start
                  <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" type="datetime-local" value={blackoutForm.startDate} onChange={(e) => setBlackoutForm((c) => ({ ...c, startDate: e.target.value }))} />
                </label>
                <label className="text-sm font-medium text-stone-700">
                  End
                  <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" type="datetime-local" value={blackoutForm.endDate} onChange={(e) => setBlackoutForm((c) => ({ ...c, endDate: e.target.value }))} />
                </label>
                <label className="text-sm font-medium text-stone-700 md:col-span-2">
                  Reason
                  <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" value={blackoutForm.reason} onChange={(e) => setBlackoutForm((c) => ({ ...c, reason: e.target.value }))} />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 md:col-span-2">
                  <input checked={blackoutForm.recurring} onChange={(e) => setBlackoutForm((c) => ({ ...c, recurring: e.target.checked }))} type="checkbox" />
                  Repeat yearly
                </label>
                <div className="md:col-span-2">
                  <button className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700" type="submit">
                    Add blackout date
                  </button>
                </div>
              </form>

              <div className="mt-4 space-y-2">
                {(selectedAmenity?.blackoutDates ?? []).map((b) => (
                  <div key={b.id} className="rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
                    {new Date(b.startDate).toLocaleString()} - {new Date(b.endDate).toLocaleString()}
                    {b.reason ? ` — ${b.reason}` : ''}
                    {b.recurring ? ' (recurring)' : ''}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---- RIGHT: config agent ---- */}
          <section className="space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">Configuration agent</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Ask the AI assistant to help configure amenities, fees, or policies.
              </p>
              <form className="mt-4 space-y-3" onSubmit={sendConfigMessage}>
                <textarea
                  className="min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm"
                  placeholder='Try "set the pool fee to $75" or "list all amenities"'
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                />
                <button className="w-full rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700" type="submit">
                  Ask configuration agent
                </button>
              </form>
              {chatReply && (
                <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-700">
                  {chatReply}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
