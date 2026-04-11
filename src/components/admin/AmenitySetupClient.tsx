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

type Area = {
  id: string
  name: string
  sortOrder: number
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
  suggestedAmenityIds: string[]
  blackoutDates: BlackoutDate[]
  areaId: string | null
  sortOrder: number
  isDefault: boolean
  hasRules: boolean
  rules: string | null
  hasAccessInstructions: boolean
  accessInstructions: string | null
  allowExternalBooking: boolean
  externalRentalFee: number
  externalDepositAmount: number
  photos: string[]
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
  suggestedAmenityIds: string[]
  areaId: string
  sortOrder: number
  isDefault: boolean
  hasRules: boolean
  rules: string
  hasAccessInstructions: boolean
  accessInstructions: string
  allowExternalBooking: boolean
  externalRentalFee: number
  externalDepositAmount: number
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
  suggestedAmenityIds: [],
  areaId: '',
  sortOrder: 0,
  isDefault: false,
  hasRules: false,
  rules: '',
  hasAccessInstructions: false,
  accessInstructions: '',
  allowExternalBooking: false,
  externalRentalFee: 0,
  externalDepositAmount: 0,
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
    suggestedAmenityIds: amenity.suggestedAmenityIds ?? [],
    areaId: amenity.areaId ?? '',
    sortOrder: amenity.sortOrder ?? 0,
    isDefault: amenity.isDefault ?? false,
    hasRules: amenity.hasRules ?? false,
    rules: amenity.rules ?? '',
    hasAccessInstructions: amenity.hasAccessInstructions ?? false,
    accessInstructions: amenity.accessInstructions ?? '',
    allowExternalBooking: amenity.allowExternalBooking ?? false,
    externalRentalFee: amenity.externalRentalFee ?? 0,
    externalDepositAmount: amenity.externalDepositAmount ?? 0,
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
  initialAreas?: Area[]
}

export function AmenitySetupClient({ initialAmenities, initialStaff, initialAreas = [] }: Props) {
  const [amenities, setAmenities] = useState<Amenity[]>(initialAmenities)
  const [staff, setStaff] = useState<Staff[]>(initialStaff)
  const [areas, setAreas] = useState<Area[]>(initialAreas)
  const [selectedAmenityId, setSelectedAmenityId] = useState<string | null>(null)
  const [amenityForm, setAmenityForm] = useState<AmenityForm>({ ...emptyAmenityForm })
  const [blackoutForm, setBlackoutForm] = useState({
    startDate: '',
    endDate: '',
    reason: '',
    recurring: false,
  })
  const [notice, setNotice] = useState<string | null>(null)
  const [noticeType, setNoticeType] = useState<'success' | 'error'>('success')
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showForm, setShowForm] = useState(false)

  function showNotice(message: string, type: 'success' | 'error' = 'success') {
    setNotice(message)
    setNoticeType(type)
    if (type === 'success') {
      setTimeout(() => setNotice(null), 3000)
    }
  }

  // Area management state
  const [areaFormName, setAreaFormName] = useState('')
  const [editingAreaId, setEditingAreaId] = useState<string | null>(null)
  const [editingAreaName, setEditingAreaName] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  async function uploadPhoto(file: File) {
    if (!selectedAmenity) return
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      const res = await fetch(`/api/admin/amenities/${selectedAmenity.id}/photos`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const data = await res.json()
        showNotice(data.error ?? 'Failed to upload photo', 'error')
        return
      }
      showNotice('Photo uploaded!')
      await loadData()
    } catch {
      showNotice('Failed to upload photo', 'error')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function deletePhoto(url: string) {
    if (!selectedAmenity) return
    if (!confirm('Remove this photo?')) return
    try {
      const res = await fetch(`/api/admin/amenities/${selectedAmenity.id}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (!res.ok) {
        showNotice('Failed to remove photo', 'error')
        return
      }
      showNotice('Photo removed')
      await loadData()
    } catch {
      showNotice('Failed to remove photo', 'error')
    }
  }

  const selectedAmenity = amenities.find((a) => a.id === selectedAmenityId) ?? null
  const f = amenityForm
  const set = (patch: Partial<AmenityForm>) => {
    setAmenityForm((c) => ({ ...c, ...patch }))
    setIsDirty(true)
  }

  // Group amenities by area
  function getGroupedAmenities() {
    const grouped: { area: Area | null; amenities: Amenity[] }[] = []

    // Add area groups
    for (const area of areas) {
      const areaAmenities = amenities
        .filter((a) => a.areaId === area.id)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      grouped.push({ area, amenities: areaAmenities })
    }

    // Add ungrouped amenities
    const ungrouped = amenities
      .filter((a) => !a.areaId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    if (ungrouped.length > 0) {
      grouped.push({ area: null, amenities: ungrouped })
    }

    return grouped
  }

  async function loadData() {
    const [aRes, sRes, areasRes] = await Promise.all([
      fetch('/api/admin/amenities'),
      fetch('/api/admin/staff'),
      fetch('/api/admin/areas'),
    ])
    const aData = await aRes.json()
    const sData = await sRes.json()
    const areasData = await areasRes.json()
    setAmenities(aData.amenities ?? [])
    setStaff(sData.staff ?? [])
    setAreas(areasData.areas ?? [])
  }

  function selectAmenity(amenity: Amenity | null) {
    if (isDirty && !confirm('You have unsaved changes. Discard them?')) return
    setSelectedAmenityId(amenity?.id ?? null)
    setAmenityForm(toAmenityForm(amenity))
    setIsDirty(false)
    setShowForm(false)
  }

  function openCreateForm() {
    if (isDirty && !confirm('You have unsaved changes. Discard them?')) return
    setSelectedAmenityId(null)
    setAmenityForm({ ...emptyAmenityForm })
    setIsDirty(false)
    setShowForm(true)
  }

  function openEditForm() {
    setShowForm(true)
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
      suggestedAmenityIds: f.suggestedAmenityIds,
      areaId: f.areaId || null,
      sortOrder: f.sortOrder,
      isDefault: f.isDefault,
      hasRules: f.hasRules,
      rules: f.hasRules ? (f.rules || null) : null,
      hasAccessInstructions: f.hasAccessInstructions,
      accessInstructions: f.hasAccessInstructions ? (f.accessInstructions || null) : null,
      allowExternalBooking: f.allowExternalBooking,
      externalRentalFee: f.allowExternalBooking ? Number(f.externalRentalFee) : 0,
      externalDepositAmount: f.allowExternalBooking ? Number(f.externalDepositAmount) : 0,
    }

    const url = selectedAmenity ? `/api/admin/amenities/${selectedAmenity.id}` : '/api/admin/amenities'
    const method = selectedAmenity ? 'PUT' : 'POST'
    setSaving(true)
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { showNotice(data.error ?? 'Unable to save amenity.', 'error'); return }
      showNotice(selectedAmenity ? `${f.name} saved successfully!` : `${f.name} created!`)
      setIsDirty(false)
      await loadData()
      if (!selectedAmenity) {
        setAmenityForm({ ...emptyAmenityForm })
      }
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function deleteSelectedAmenity() {
    if (!selectedAmenity) return
    if (!confirm(`Delete "${selectedAmenity.name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/admin/amenities/${selectedAmenity.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      showNotice(data.error ?? 'Unable to delete amenity.')
      return
    }
    showNotice(`"${selectedAmenity.name}" deleted.`)
    setSelectedAmenityId(null)
    setAmenityForm({ ...emptyAmenityForm })
    await loadData()
  }

  async function addBlackoutDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedAmenity) { showNotice('Choose an amenity first.'); return }
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
    if (!res.ok) { showNotice(data.error ?? 'Unable to add blackout date.'); return }
    setBlackoutForm({ startDate: '', endDate: '', reason: '', recurring: false })
    showNotice('Blackout date added.')
    await loadData()
  }

  // --- Area CRUD ---
  async function createArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!areaFormName.trim()) return
    const res = await fetch('/api/admin/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: areaFormName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { showNotice(data.error ?? 'Unable to create area.'); return }
    setAreaFormName('')
    showNotice('Area created.')
    await loadData()
  }

  async function saveAreaRename(areaId: string) {
    if (!editingAreaName.trim()) return
    const res = await fetch(`/api/admin/areas/${areaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingAreaName.trim() }),
    })
    if (!res.ok) {
      const data = await res.json()
      showNotice(data.error ?? 'Unable to rename area.')
      return
    }
    setEditingAreaId(null)
    setEditingAreaName('')
    showNotice('Area renamed.')
    await loadData()
  }

  async function deleteAreaById(areaId: string) {
    const area = areas.find((a) => a.id === areaId)
    if (!confirm(`Delete area "${area?.name}"? Amenities in this area will become ungrouped.`)) return
    const res = await fetch(`/api/admin/areas/${areaId}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      showNotice(data.error ?? 'Unable to delete area.')
      return
    }
    showNotice('Area deleted.')
    await loadData()
  }

  // --- Reorder amenity within its group ---
  async function moveAmenity(amenityId: string, direction: 'up' | 'down') {
    const amenity = amenities.find((a) => a.id === amenityId)
    if (!amenity) return

    // Get siblings in same area, sorted
    const siblings = amenities
      .filter((a) => (a.areaId ?? null) === (amenity.areaId ?? null))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

    const idx = siblings.findIndex((a) => a.id === amenityId)
    if (direction === 'up' && idx <= 0) return
    if (direction === 'down' && idx >= siblings.length - 1) return

    // Move the item in the array
    const reordered = [...siblings]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const temp = reordered[idx]
    reordered[idx] = reordered[swapIdx]
    reordered[swapIdx] = temp

    // Reassign sequential sortOrders to all siblings
    const items = reordered.map((a, i) => ({ id: a.id, sortOrder: i }))

    const res = await fetch('/api/admin/amenities/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    if (res.ok) await loadData()
  }

  const groupedAmenities = getGroupedAmenities()

  return (
    <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">Amenity Setup</p>
          <h1 className="mt-2 text-2xl sm:text-4xl font-semibold text-stone-900">Amenities, policies, and blackout dates</h1>
        </div>

        {/* Toast notification */}
        {notice && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg transition-all animate-in slide-in-from-top ${
            noticeType === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          }`}>
            {noticeType === 'success' ? '✓' : '✕'} {notice}
            <button onClick={() => setNotice(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          {/* ---- LEFT: amenity list grouped by area ---- */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-900">Amenities</h2>
              <button
                className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700"
                onClick={openCreateForm}
                type="button"
              >
                New
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {groupedAmenities.map((group) => (
                <div key={group.area?.id ?? '_ungrouped'}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-stone-400">
                    {group.area?.name ?? 'Other'}
                  </p>
                  <div className="space-y-1.5">
                    {group.amenities.map((a, idx) => (
                      <div key={a.id} className="flex items-center gap-1">
                        {/* Reorder arrows */}
                        <div className="flex shrink-0 flex-col">
                          <button
                            type="button"
                            className="px-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-30"
                            disabled={idx === 0}
                            onClick={() => moveAmenity(a.id, 'up')}
                            aria-label="Move up"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M5 15l7-7 7 7" /></svg>
                          </button>
                          <button
                            type="button"
                            className="px-0.5 text-stone-300 hover:text-stone-600 disabled:opacity-30"
                            disabled={idx === group.amenities.length - 1}
                            onClick={() => moveAmenity(a.id, 'down')}
                            aria-label="Move down"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 9l-7 7-7-7" /></svg>
                          </button>
                        </div>
                        <button
                          className={`min-w-0 flex-1 rounded-2xl px-3 py-2.5 text-left ${
                            selectedAmenityId === a.id ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-700'
                          }`}
                          onClick={() => selectAmenity(a)}
                          type="button"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {a.isDefault && <span className="shrink-0 text-amber-400">★</span>}
                            <span className="truncate font-medium">{a.name}</span>
                          </div>
                          <div className="truncate text-xs opacity-80">
                            {a.rentalFee > 0 ? `$${a.rentalFee} + $${a.depositAmount} deposit` : 'Free'}
                            {a.requiresApproval ? ' \u00b7 Approval required' : ' \u00b7 Auto-approved'}
                          </div>
                        </button>
                      </div>
                    ))}
                    {group.amenities.length === 0 && (
                      <p className="px-3 py-2 text-xs italic text-stone-400">No amenities</p>
                    )}
                  </div>
                </div>
              ))}
              {groupedAmenities.length === 0 && (
                <p className="text-sm text-stone-500">No amenities yet.</p>
              )}
            </div>
          </section>

          {/* ---- CENTER: summary or form ---- */}
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            {!showForm ? (
              /* --- Summary view --- */
              selectedAmenity ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-stone-900">{selectedAmenity.name}</h2>
                    <div className="flex gap-2">
                      <button onClick={openEditForm} type="button" className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
                        Edit
                      </button>
                      <button onClick={deleteSelectedAmenity} type="button" className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </div>
                  {selectedAmenity.isDefault && (
                    <p className="mb-3 text-xs text-amber-600 font-medium">★ Default amenity on booking calendar</p>
                  )}
                  {selectedAmenity.description && (
                    <p className="text-sm text-stone-600 mb-4">{selectedAmenity.description}</p>
                  )}
                  {/* Photos */}
                  {selectedAmenity.photos?.length > 0 && (
                    <div className="mb-4">
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {selectedAmenity.photos.map((url) => (
                          <img key={url} src={url} alt={selectedAmenity.name} className="h-24 w-32 rounded-xl object-cover flex-shrink-0 border border-stone-200" />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Photo upload (admin) */}
                  <div className="mb-4">
                    <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 px-4 py-3 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition">
                      <svg className="h-5 w-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                      <span className="text-sm text-stone-500">{uploadingPhoto ? 'Uploading...' : 'Add photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingPhoto}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadPhoto(file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    {selectedAmenity.photos?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedAmenity.photos.map((url) => (
                          <div key={url} className="relative group">
                            <img src={url} alt="" className="h-16 w-20 rounded-lg object-cover border border-stone-200" />
                            <button
                              type="button"
                              onClick={() => deletePhoto(url)}
                              className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-stone-50 px-4 py-3">
                      <p className="text-xs text-stone-400">Capacity</p>
                      <p className="font-semibold text-stone-900">{selectedAmenity.capacity}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 px-4 py-3">
                      <p className="text-xs text-stone-400">Pricing</p>
                      <p className="font-semibold text-stone-900">
                        {selectedAmenity.rentalFee > 0 ? `$${selectedAmenity.rentalFee}` : 'Free'}
                        {selectedAmenity.depositAmount > 0 && ` + $${selectedAmenity.depositAmount} deposit`}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 px-4 py-3">
                      <p className="text-xs text-stone-400">Approval</p>
                      <p className="font-semibold text-stone-900">{selectedAmenity.requiresApproval ? 'Required' : 'Auto-approved'}</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 px-4 py-3">
                      <p className="text-xs text-stone-400">Janitorial</p>
                      <p className="font-semibold text-stone-900">
                        {selectedAmenity.janitorialAssignment === 'none' ? 'None' : selectedAmenity.janitorialAssignment}
                        {selectedAmenity.defaultTurnTimeHours > 0 && ` (${selectedAmenity.defaultTurnTimeHours}h turn)`}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 px-4 py-3">
                      <p className="text-xs text-stone-400">Max Advance Booking</p>
                      <p className="font-semibold text-stone-900">{selectedAmenity.maxAdvanceBookingDays} days</p>
                    </div>
                    <div className="rounded-2xl bg-stone-50 px-4 py-3">
                      <p className="text-xs text-stone-400">Area</p>
                      <p className="font-semibold text-stone-900">{areas.find((a) => a.id === selectedAmenity.areaId)?.name ?? 'None'}</p>
                    </div>
                  </div>
                  {selectedAmenity.hasRules && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Rules</p>
                      <p className="text-sm text-amber-800 whitespace-pre-wrap">{selectedAmenity.rules}</p>
                    </div>
                  )}
                  {selectedAmenity.hasAccessInstructions && (
                    <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs font-medium text-emerald-700 mb-1">Access Instructions</p>
                      <p className="text-sm text-emerald-800 whitespace-pre-wrap">{selectedAmenity.accessInstructions}</p>
                    </div>
                  )}
                  {(selectedAmenity.parentAmenityId || selectedAmenity.childAmenityIds?.length > 0) && (
                    <div className="mt-4 text-sm text-stone-500">
                      <p className="text-xs font-medium text-stone-400 mb-1">Linked Amenities</p>
                      {selectedAmenity.parentAmenityId && (
                        <p>Parent: <span className="text-stone-700">{amenities.find((a) => a.id === selectedAmenity.parentAmenityId)?.name ?? 'Unknown'}</span></p>
                      )}
                      {selectedAmenity.childAmenityIds?.length > 0 && (
                        <p>Children: <span className="text-stone-700">{selectedAmenity.childAmenityIds.map((id) => amenities.find((a) => a.id === id)?.name ?? id).join(', ')}</span></p>
                      )}
                    </div>
                  )}
                  {selectedAmenity.suggestedAmenityIds?.length > 0 && (
                    <div className="mt-3 text-sm text-stone-500">
                      <p className="text-xs font-medium text-stone-400 mb-1">Suggested Pairings</p>
                      <p className="text-stone-700">{selectedAmenity.suggestedAmenityIds.map((id) => amenities.find((a) => a.id === id)?.name ?? id).join(', ')}</p>
                    </div>
                  )}
                  {/* External booking */}
                  {selectedAmenity.allowExternalBooking && (
                    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <p className="text-xs font-medium text-emerald-700 mb-1">External Bookings Enabled</p>
                      <p className="text-sm text-emerald-800">
                        {selectedAmenity.externalRentalFee > 0
                          ? `$${selectedAmenity.externalRentalFee} rental${selectedAmenity.externalDepositAmount > 0 ? ` + $${selectedAmenity.externalDepositAmount} deposit` : ''}`
                          : 'Same pricing as residents'}
                      </p>
                    </div>
                  )}
                  {/* Blackout dates */}
                  {selectedAmenity.blackoutDates?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-stone-400 mb-2">Blackout Dates</p>
                      <div className="space-y-1">
                        {selectedAmenity.blackoutDates.map((b) => (
                          <div key={b.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-xs text-stone-600">
                            <span>{new Date(b.startDate).toLocaleDateString()} — {new Date(b.endDate).toLocaleDateString()}</span>
                            {b.reason && <span className="text-stone-400">{b.reason}</span>}
                            {b.recurring && <span className="text-amber-600">Recurring</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* --- Empty state --- */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-stone-100 p-4 mb-4">
                    <svg className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-2">
                    {amenities.length === 0 ? 'No amenities yet' : 'Select an amenity'}
                  </h3>
                  <p className="text-sm text-stone-500 max-w-xs mb-6">
                    {amenities.length === 0
                      ? 'Create your first amenity to get started with booking.'
                      : 'Click an amenity in the sidebar to view its details, or create a new one.'}
                  </p>
                  <button
                    onClick={openCreateForm}
                    type="button"
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
                  >
                    Create Amenity
                  </button>
                </div>
              )
            ) : (
            /* --- Edit/Create form --- */
            <div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => { if (!isDirty || confirm('Discard changes?')) setShowForm(false) }} type="button" className="text-sm text-stone-500 hover:text-stone-700">
                &larr; Back
              </button>
              <h2 className="text-lg font-semibold text-stone-900">
                {selectedAmenity ? `Edit ${selectedAmenity.name}` : 'Create amenity'}
              </h2>
            </div>

            <form className="space-y-5" onSubmit={saveAmenity}>
              <label className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                <input type="checkbox" checked={f.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} className="rounded" />
                ★ Set as default amenity on booking calendar
              </label>

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

              {/* -- Area dropdown -- */}
              <label className="block text-sm font-medium text-stone-700">
                Area <Info tip="Group this amenity into an area for organized navigation. Areas help residents find amenities quickly." />
                <select
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900"
                  value={f.areaId}
                  onChange={(e) => set({ areaId: e.target.value })}
                >
                  <option value="">No area (ungrouped)</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </label>

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

              {/* -- Rules toggle -- */}
              <div className="border-t border-stone-200 pt-5">
                <Toggle checked={f.hasRules} onChange={(v) => set({ hasRules: v })} label="Booking rules" tip="When enabled, residents must accept these rules before they can submit a booking request." />
              </div>

              {f.hasRules && (
                <div className="rounded-2xl bg-stone-50 p-4">
                  <label className="text-sm font-medium text-stone-700">
                    Rules text
                    <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" placeholder="Enter the rules residents must accept..." value={f.rules} onChange={(e) => set({ rules: e.target.value })} />
                  </label>
                </div>
              )}

              {/* -- Access instructions toggle -- */}
              <div className="border-t border-stone-200 pt-5">
                <Toggle checked={f.hasAccessInstructions} onChange={(v) => set({ hasAccessInstructions: v })} label="Access instructions" tip="When enabled, access instructions are sent to the resident 1 hour before their booking starts. Use this for gate codes, key locations, etc." />
              </div>

              {f.hasAccessInstructions && (
                <div className="rounded-2xl bg-stone-50 p-4">
                  <label className="text-sm font-medium text-stone-700">
                    Instructions
                    <textarea className="mt-2 min-h-32 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" placeholder="Gate code, key location, WiFi password, etc." value={f.accessInstructions} onChange={(e) => set({ accessInstructions: e.target.value })} />
                  </label>
                </div>
              )}

              {/* -- External booking toggle -- */}
              <div className="border-t border-stone-200 pt-5">
                <Toggle checked={f.allowExternalBooking} onChange={(v) => set({ allowExternalBooking: v })} label="Allow external bookings" tip="When enabled, non-residents can book this amenity through a public booking page. Great for generating revenue from pool day passes, event space rentals, or court time." />
              </div>

              {f.allowExternalBooking && (
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                  <p className="text-xs font-medium text-emerald-700">External guest pricing</p>
                  <p className="text-xs text-emerald-600">Set different prices for non-residents. Leave at $0 to use the same price as residents.</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium text-stone-700">
                      External rental fee ($)
                      <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={0} step={0.01} value={f.externalRentalFee} onChange={(e) => set({ externalRentalFee: Number(e.target.value) })} />
                    </label>
                    <label className="text-sm font-medium text-stone-700">
                      External deposit ($)
                      <input className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-900" type="number" min={0} step={0.01} value={f.externalDepositAmount} onChange={(e) => set({ externalDepositAmount: Number(e.target.value) })} />
                    </label>
                  </div>
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

              <div className="border-t border-stone-200 pt-5">
                <label className="text-sm font-medium text-stone-700">
                  Suggested pairings <Info tip="Amenities that residents are prompted to also book when they select this one. E.g., suggest the Pool when booking the Clubroom." />
                </label>
                <div className="mt-2 space-y-2">
                  {amenities
                    .filter((a) => a.id !== selectedAmenity?.id)
                    .map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm text-stone-700">
                        <input
                          type="checkbox"
                          checked={f.suggestedAmenityIds.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              set({ suggestedAmenityIds: [...f.suggestedAmenityIds, a.id] })
                            } else {
                              set({ suggestedAmenityIds: f.suggestedAmenityIds.filter((id) => id !== a.id) })
                            }
                          }}
                          className="rounded"
                        />
                        {a.name}
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className={`rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
                    isDirty
                      ? 'bg-emerald-600 hover:bg-emerald-500 animate-pulse'
                      : 'bg-stone-900 hover:bg-stone-800'
                  }`}
                  disabled={saving}
                  type="submit"
                >
                  {saving ? 'Saving...' : selectedAmenity ? 'Save changes' : 'Create amenity'}
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
                    {b.reason ? ` \u2014 ${b.reason}` : ''}
                    {b.recurring ? ' (recurring)' : ''}
                  </div>
                ))}
              </div>
            </div>
            </div>
            )}
          </section>

          {/* ---- RIGHT: areas + config agent ---- */}
          <section className="space-y-6">
            {/* Area management */}
            <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900">Areas</h2>
              </div>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                Group amenities into areas for organized navigation.
              </p>

              {/* Add area form */}
              <form className="mt-3 flex gap-2" onSubmit={createArea}>
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-stone-300 px-3 py-2 text-sm text-stone-900"
                  placeholder="New area name"
                  value={areaFormName}
                  onChange={(e) => setAreaFormName(e.target.value)}
                />
                <button
                  className="shrink-0 rounded-full border border-stone-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700 hover:bg-stone-50"
                  type="submit"
                >
                  Add
                </button>
              </form>

              {/* Area list */}
              <div className="mt-3 space-y-1.5">
                {areas.map((area) => (
                  <div
                    key={area.id}
                    className="flex items-center gap-2 rounded-2xl bg-stone-50 px-3 py-2"
                  >
                    {editingAreaId === area.id ? (
                      <>
                        <input
                          className="min-w-0 flex-1 rounded-xl border border-stone-300 px-2 py-1 text-sm text-stone-900"
                          value={editingAreaName}
                          onChange={(e) => setEditingAreaName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); saveAreaRename(area.id) }
                            if (e.key === 'Escape') { setEditingAreaId(null) }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-800"
                          onClick={() => saveAreaRename(area.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="text-xs text-stone-400 hover:text-stone-600"
                          onClick={() => setEditingAreaId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-700">{area.name}</span>
                        <button
                          type="button"
                          className="text-xs text-stone-400 hover:text-stone-600"
                          onClick={() => { setEditingAreaId(area.id); setEditingAreaName(area.name) }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-xs text-red-400 hover:text-red-600"
                          onClick={() => deleteAreaById(area.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {areas.length === 0 && (
                  <p className="py-2 text-xs italic text-stone-400">No areas yet. Create one above.</p>
                )}
              </div>
            </div>

          </section>
        </div>
      </div>
    </main>
  )
}
