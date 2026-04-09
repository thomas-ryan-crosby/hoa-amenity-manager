'use client'

import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { formatDateRange } from '@/lib/format'
import { useCommunity } from '@/components/providers/CommunityProvider'

type Area = {
  id: string
  name: string
  sortOrder: number
}

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  color?: string
  editable?: boolean
  extendedProps: {
    type: 'booking' | 'turn-window'
    amenityId: string
    amenityName: string
    residentName?: string
    residentEmail?: string
    unitNumber?: string
    guestCount?: number
    status: string
    turnWindowId?: string
    bookedByName?: string
    createdByName?: string
    feeWaived?: boolean
    anonymous?: boolean
  }
}

type Amenity = {
  id: string
  name: string
  areaId: string | null
  sortOrder: number
  isDefault?: boolean
  rentalFee?: number
  depositAmount?: number
  suggestedAmenityIds?: string[]
}

type Resident = {
  id: string
  name: string
  email: string
}

const STATUS_LABELS: Record<string, string> = {
  INQUIRY_RECEIVED: 'Inquiry',
  AVAILABILITY_CHECKING: 'Checking',
  PENDING_APPROVAL: 'Pending Approval',
  PAYMENT_PENDING: 'Awaiting Payment',
  CONFIRMED: 'Confirmed',
  REMINDER_SENT: 'Confirmed',
  WAITLISTED: 'Waitlisted',
  PENDING: 'Default',
  SCHEDULED: 'Confirmed',
  COMPLETED: 'Done',
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  INQUIRY_RECEIVED: 'bg-pink-100 text-pink-800',
  AVAILABILITY_CHECKING: 'bg-pink-100 text-pink-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  PAYMENT_PENDING: 'bg-violet-100 text-violet-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  REMINDER_SENT: 'bg-blue-100 text-blue-800',
  WAITLISTED: 'bg-sky-100 text-sky-800',
  PENDING: 'bg-stone-200 text-stone-600',
  SCHEDULED: 'bg-stone-800 text-white',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
}

export function AdminCalendar() {
  const { activeCommunity } = useCommunity()
  const communityTz = activeCommunity?.timezone ?? 'America/Chicago'
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [denialReason, setDenialReason] = useState('')
  const [waiveFee, setWaiveFee] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [isMobile, setIsMobile] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)
  const calendarWrapperRef = useRef<HTMLDivElement>(null)

  // Keyboard arrow navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const api = calendarRef.current?.getApi()
      if (!api) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); api.prev() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); api.next() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // Sidebar mode: 'idle' | 'book-on-behalf' | 'cleaning-block'
  const [sidebarMode, setSidebarMode] = useState<'idle' | 'book-on-behalf' | 'cleaning-block'>('idle')
  // "Book on behalf" states
  const [adminSelection, setAdminSelection] = useState<{amenityId: string, start: string, end: string} | null>(null)
  const [bookingForm, setBookingForm] = useState({
    residentId: '',
    bookedByName: '',
    bookedByEmail: '',
    bookedByPhone: '',
    sendCommsToBookee: false,
    guestCount: 1,
    notes: '',
    feeWaived: false,
    anonymous: false,
  })
  const [residents, setResidents] = useState<Resident[]>([])
  const [nameMode, setNameMode] = useState<'resident' | 'manual'>('resident')
  const [adminSubmitting, setAdminSubmitting] = useState(false)
  const [adminAdditionalAmenities, setAdminAdditionalAmenities] = useState<string[]>([])

  // Detect mobile
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  async function loadEvents() {
    try {
      const [eventsRes, amenitiesRes] = await Promise.all([
        fetch('/api/calendar/events?role=admin'),
        fetch('/api/amenities'),
      ])

      const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] }
      const amenitiesData = amenitiesRes.ok ? await amenitiesRes.json() : { amenities: [], areas: [] }

      setEvents(eventsData.events ?? [])
      const amenityList = amenitiesData.amenities ?? []
      setAmenities(amenityList)
      setAreas(amenitiesData.areas ?? [])
      setSelectedAmenities((prev) => {
        if (prev.size === 0 && amenityList.length) {
          const defaultAmenity = amenityList.find((a: Amenity) => a.isDefault)
          return new Set([defaultAmenity?.id ?? amenityList[0].id])
        }
        return prev
      })

      // Residents fetch separately — don't let it block calendar
      try {
        const residentsRes = await fetch('/api/admin/residents')
        if (residentsRes.ok) {
          const residentsData = await residentsRes.json()
          setResidents(residentsData.residents ?? [])
        }
      } catch {
        // Residents list is optional for calendar display
      }
    } catch (loadError) {
      console.error('Failed to load admin calendar', loadError)
      setError('Unable to load calendar data right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  // Group amenities by area for tab rendering
  const amenityGroups = useMemo(() => {
    const groups: { area: Area | null; amenities: Amenity[] }[] = []

    // Areas sorted by sortOrder (already sorted from API)
    for (const area of areas) {
      const areaAmenities = amenities
        .filter((a) => a.areaId === area.id)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      if (areaAmenities.length > 0) {
        groups.push({ area, amenities: areaAmenities })
      }
    }

    // Ungrouped amenities
    const ungrouped = amenities
      .filter((a) => !a.areaId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    if (ungrouped.length > 0) {
      groups.push({ area: null, amenities: ungrouped })
    }

    return groups
  }, [amenities, areas])

  const filteredEvents = useMemo(
    () => selectedAmenities.size > 0
      ? events.filter((e) => selectedAmenities.has(e.extendedProps.amenityId))
      : events,
    [events, selectedAmenities],
  )

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId],
  )

  const isTurnWindow = selectedEvent?.extendedProps.type === 'turn-window'
  const isBooking = selectedEvent?.extendedProps.type === 'booking'
  const isLinkedEvent = selectedId?.startsWith('linked-') ?? false

  // Extract real booking ID from linked event IDs like "linked-{bookingId}-{amenityId}"
  function getRealBookingId(): string | null {
    if (!selectedEvent) return null
    if (!isLinkedEvent) return selectedEvent.id
    const parts = selectedEvent.id.split('-')
    // linked-{bookingId}-{amenityId} — bookingId may itself contain dashes
    // but amenityId is the last segment
    parts.shift() // remove "linked"
    parts.pop()   // remove linked amenityId
    return parts.join('-') || null
  }

  // Determine which amenity to use for calendar selection (first selected amenity)
  const primaryAmenityId = useMemo(() => {
    const arr = Array.from(selectedAmenities)
    return arr.length > 0 ? arr[0] : ''
  }, [selectedAmenities])

  function clearAdminSelection() {
    setAdminSelection(null)
    setAdminAdditionalAmenities([])
    setBookingForm({
      residentId: '',
      bookedByName: '',
      bookedByEmail: '',
      bookedByPhone: '',
      sendCommsToBookee: false,
      guestCount: 1,
      notes: '',
      feeWaived: false,
      anonymous: false,
    })
    setNameMode('resident')
    calendarRef.current?.getApi().unselect()
  }

  function handleAmenityClick(amenityId: string, e: MouseEvent) {
    if (e.shiftKey) {
      setSelectedAmenities((prev) => {
        const next = new Set(prev)
        if (next.has(amenityId)) {
          next.delete(amenityId)
        } else {
          next.add(amenityId)
        }
        return next
      })
    } else {
      setSelectedAmenities(new Set([amenityId]))
    }
  }

  function handleSelectAll() {
    setSelectedAmenities(new Set())
  }

  async function approveBooking() {
    const bookingId = getRealBookingId()
    if (!bookingId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeWaived: waiveFee }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unable to approve.')
      await loadEvents()
      setSelectedId(null)
      setWaiveFee(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve.')
    } finally {
      setBusy(false)
    }
  }

  async function denyBooking() {
    const bookingId = getRealBookingId()
    if (!bookingId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: denialReason }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unable to deny.')
      await loadEvents()
      setSelectedId(null)
      setDenialReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deny.')
    } finally {
      setBusy(false)
    }
  }

  async function cancelBooking() {
    const bookingId = getRealBookingId()
    if (!bookingId) return
    if (!confirm('Cancel this booking? The resident will be notified and any applicable refund will be processed.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/cancel`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unable to cancel.')
      await loadEvents()
      setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel.')
    } finally {
      setBusy(false)
    }
  }

  async function updateTurnWindow(turnWindowId: string, start: string, end: string) {
    try {
      const res = await fetch(`/api/turn-windows/${turnWindowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualStart: start, actualEnd: end }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unable to update turn window.')
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update turn window.')
    }
  }

  async function confirmTurnWindow() {
    if (!selectedEvent?.extendedProps.turnWindowId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/turn-windows/${selectedEvent.extendedProps.turnWindowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unable to confirm.')
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to confirm turn window.')
    } finally {
      setBusy(false)
    }
  }

  async function completeTurnWindow() {
    if (!selectedEvent?.extendedProps.turnWindowId) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/turn-windows/${selectedEvent.extendedProps.turnWindowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unable to complete.')
      await loadEvents()
      setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete turn window.')
    } finally {
      setBusy(false)
    }
  }

  async function handleAdminBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminSelection) return

    setAdminSubmitting(true)
    setError(null)

    try {
      const body: Record<string, unknown> = {
        amenityId: adminSelection.amenityId,
        additionalAmenityIds: adminAdditionalAmenities.length > 0 ? adminAdditionalAmenities : undefined,
        startDatetime: adminSelection.start,
        endDatetime: adminSelection.end,
        guestCount: bookingForm.guestCount,
        notes: bookingForm.notes.trim() || undefined,
        feeWaived: bookingForm.feeWaived,
        anonymous: bookingForm.anonymous,
      }

      if (nameMode === 'resident' && bookingForm.residentId) {
        body.residentId = bookingForm.residentId
      } else if (nameMode === 'manual' && bookingForm.bookedByName.trim()) {
        body.bookedByName = bookingForm.bookedByName.trim()
        if (bookingForm.bookedByEmail.trim()) body.bookedByEmail = bookingForm.bookedByEmail.trim()
        if (bookingForm.bookedByPhone.trim()) body.bookedByPhone = bookingForm.bookedByPhone.trim()
        body.sendCommsToBookee = bookingForm.sendCommsToBookee
      }

      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Unable to create booking.')
      }

      clearAdminSelection()
      await loadEvents()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create booking.')
    } finally {
      setAdminSubmitting(false)
    }
  }

  if (loading) {
    return <div className="h-[640px] animate-pulse rounded-3xl bg-stone-100" />
  }

  return (
    <div className="grid gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        {/* Amenity tabs grouped by area + view toggle */}
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            <button
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedAmenities.size === 0
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              onClick={handleSelectAll}
              type="button"
            >
              All amenities
            </button>
            {amenityGroups.map((group) => (
              <div key={group.area?.id ?? '_ungrouped'} className="flex flex-wrap items-center gap-1.5">
                <span className="mr-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                  {group.area?.name ?? 'Other'}
                </span>
                {group.amenities.map((amenity) => (
                  <button
                    key={amenity.id}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      selectedAmenities.has(amenity.id)
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                    onClick={(e) => handleAmenityClick(amenity.id, e)}
                    type="button"
                  >
                    {amenity.name}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* View toggle */}
          <div className="flex overflow-hidden rounded-full border border-stone-200">
            <button
              className={`px-4 py-2 text-sm font-medium transition ${
                viewMode === 'calendar'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-50'
              }`}
              onClick={() => setViewMode('calendar')}
              type="button"
            >
              Calendar
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium transition ${
                viewMode === 'list'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:bg-stone-50'
              }`}
              onClick={() => setViewMode('list')}
              type="button"
            >
              List
            </button>
          </div>
        </div>

        <p className="mb-2 text-xs text-stone-400">
          Tip: Shift+click to view multiple amenities together
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#EC4899]" /> New request
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Pending approval
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" /> Awaiting payment
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#0EA5E9]" /> Waitlisted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#78716C]" /> Cleaning
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#A1A1AA]" /> Cleaning done
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#E7E5E4]" /> Blocked (linked)
          </span>
        </div>

        {viewMode === 'calendar' ? (
          <div ref={calendarWrapperRef} className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 sm:p-4 shadow-sm group">
            <button
              className="absolute left-0 top-12 bottom-0 z-10 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-stone-200/60 to-transparent hover:from-stone-300/80"
              onClick={() => calendarRef.current?.getApi().prev()}
              type="button"
              aria-label="Previous"
            >
              <span className="text-stone-600 text-lg font-bold">&lsaquo;</span>
            </button>
            <button
              className="absolute right-0 top-12 bottom-0 z-10 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-stone-200/60 to-transparent hover:from-stone-300/80"
              onClick={() => calendarRef.current?.getApi().next()}
              type="button"
              aria-label="Next"
            >
              <span className="text-stone-600 text-lg font-bold">&rsaquo;</span>
            </button>
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={isMobile ? 'timeGridDay' : 'dayGridMonth'}
              eventDisplay="block"
              allDaySlot={false}
              stickyHeaderDates
              height="calc(100vh - 200px)"
              views={{
                rolling3Day: {
                  type: 'timeGrid',
                  duration: { days: 7 },
                  dateIncrement: { days: 3 },
                  buttonText: 'Week',
                },
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridDay,rolling3Day,dayGridMonth',
              }}
              events={filteredEvents}
              selectable
              selectMirror
              unselectAuto={false}
              selectMinDistance={isMobile ? 0 : 5}
              longPressDelay={isMobile ? 300 : 0}
              selectAllow={(info) => !info.allDay}
              dateClick={(info) => {
                if (info.view.type === 'dayGridMonth') {
                  const centered = new Date(info.dateStr)
                  centered.setDate(centered.getDate() - 3)
                  calendarRef.current?.getApi().changeView('rolling3Day', centered)
                }
              }}
              navLinks
              navLinkDayClick={(date) => {
                const centered = new Date(date)
                centered.setDate(centered.getDate() - 3)
                calendarRef.current?.getApi().changeView('rolling3Day', centered)
              }}
              select={(info) => {
                if (!primaryAmenityId || info.allDay) return
                setSelectedId(null)
                if (sidebarMode === 'idle') setSidebarMode('book-on-behalf')
                setAdminSelection({
                  amenityId: primaryAmenityId,
                  start: info.startStr,
                  end: info.endStr,
                })
                setBookingForm({
                  residentId: '',
                  bookedByName: '',
                  bookedByEmail: '',
                  bookedByPhone: '',
                  sendCommsToBookee: false,
                  guestCount: 1,
                  notes: '',
                  feeWaived: false,
                  anonymous: false,
                })
                setNameMode('resident')
                setError(null)
              }}
              editable={false}
              eventStartEditable
              eventDurationEditable
              eventClick={(info) => {
                clearAdminSelection()
                setSelectedId(info.event.id)
                setDenialReason('')
                setError(null)
              }}
              eventDrop={(info) => {
                const props = info.event.extendedProps
                if (props.type === 'turn-window' && props.turnWindowId && props.status !== 'COMPLETED') {
                  updateTurnWindow(props.turnWindowId, info.event.startStr, info.event.endStr)
                } else {
                  info.revert()
                }
              }}
              eventResize={(info) => {
                const props = info.event.extendedProps
                if (props.type === 'turn-window' && props.turnWindowId && props.status !== 'COMPLETED') {
                  updateTurnWindow(props.turnWindowId, info.event.startStr, info.event.endStr)
                } else {
                  info.revert()
                }
              }}
              slotEventOverlap
              eventDidMount={(info) => {
                const harness = info.el.closest('.fc-timegrid-event-harness') as HTMLElement
                if (!harness) return

                const myStart = info.event.start?.getTime() ?? 0
                const myEnd = info.event.end?.getTime() ?? 0
                if (!myStart || !myEnd) return

                const api = calendarRef.current?.getApi()
                if (!api) return

                let overlapIndex = 0
                api.getEvents().forEach((other) => {
                  if (other.id === info.event.id || !other.start || !other.end) return
                  if (other.id <= info.event.id) return
                  if (other.start.getTime() < myEnd && other.end.getTime() > myStart) overlapIndex++
                })

                const widthPercent = Math.max(50, 90 - overlapIndex * 5)
                harness.style.setProperty('width', `${widthPercent}%`, 'important')
                harness.style.setProperty('left', '0', 'important')
                harness.style.setProperty('right', 'auto', 'important')
                harness.setAttribute('data-overlap-index', String(overlapIndex))
              }}
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              scrollTime="08:00:00"
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
                No bookings for the selected amenities.
              </div>
            )}
            {filteredEvents
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .map((event) => {
                const props = event.extendedProps
                const isTW = props.type === 'turn-window'
                const status = props.status
                const badgeStyle = STATUS_BADGE_STYLES[status] ?? 'bg-stone-200 text-stone-700'
                const label = isTW
                  ? `Cleaning (${STATUS_LABELS[status] ?? status.replaceAll('_', ' ')})`
                  : STATUS_LABELS[status] ?? status.replaceAll('_', ' ')

                return (
                  <button
                    key={event.id}
                    className={`w-full text-left rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                      selectedId === event.id
                        ? 'border-emerald-400 ring-1 ring-emerald-400'
                        : 'border-stone-200'
                    }`}
                    style={{ borderLeftWidth: '4px', borderLeftColor: event.color ?? '#9CA3AF' }}
                    onClick={() => {
                      clearAdminSelection()
                      setSelectedId(event.id)
                      setDenialReason('')
                      setError(null)
                    }}
                    type="button"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900">
                          {props.amenityName}
                          {isTW && (
                            <span className="ml-2 text-xs font-normal text-stone-500">
                              (Turn Window)
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {formatDateRange(event.start, event.end, communityTz)}
                        </p>
                        {!isTW && props.residentName && (
                          <p className="mt-1 text-sm text-stone-500">
                            {props.residentName}
                            {props.unitNumber ? ` - Unit ${props.unitNumber}` : ''}
                            {props.guestCount != null ? ` - ${props.guestCount} guest${props.guestCount !== 1 ? 's' : ''}` : ''}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex shrink-0 self-start items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}>
                        {label}
                      </span>
                    </div>
                  </button>
                )
              })}
          </div>
        )}
      </div>

      <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          {adminSelection && !selectedEvent && sidebarMode === 'cleaning-block'
            ? 'Add Cleaning Block'
            : adminSelection && !selectedEvent
              ? 'Book on Behalf'
              : isTurnWindow ? 'Cleaning Window' : 'Booking Review'}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-900">
          {adminSelection && !selectedEvent
            ? amenities.find((a) => a.id === adminSelection.amenityId)?.name ?? 'Select'
            : selectedEvent
              ? selectedEvent.extendedProps.amenityName
              : 'Select an event'}
        </h2>

        {/* Standalone cleaning block form */}
        {adminSelection && !selectedEvent && sidebarMode === 'cleaning-block' ? (
          <form className="mt-5 space-y-4" onSubmit={async (e) => {
            e.preventDefault()
            setBusy(true)
            setError(null)
            try {
              const res = await fetch('/api/admin/turn-windows', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  amenityId: adminSelection.amenityId,
                  startDatetime: adminSelection.start,
                  endDatetime: adminSelection.end,
                }),
              })
              if (!res.ok) throw new Error((await res.json()).error ?? 'Failed')
              setAdminSelection(null)
              setSidebarMode('idle')
              calendarRef.current?.getApi().unselect()
              await loadEvents()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create cleaning block')
            } finally {
              setBusy(false)
            }
          }}>
            <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              <p><strong>Amenity:</strong> {amenities.find((a) => a.id === adminSelection.amenityId)?.name}</p>
              <p><strong>Time:</strong> {formatDateRange(adminSelection.start, adminSelection.end, communityTz)}</p>
            </div>
            <p className="text-sm text-stone-500">
              This creates a standalone cleaning/maintenance block that is not tied to any booking.
            </p>
            {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <div className="flex gap-3">
              <button className="flex-1 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-stone-400" disabled={busy} type="submit">
                {busy ? 'Creating...' : 'Create cleaning block'}
              </button>
              <button className="rounded-full border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-600" type="button" onClick={() => { setAdminSelection(null); setSidebarMode('idle'); calendarRef.current?.getApi().unselect() }}>
                Cancel
              </button>
            </div>
          </form>
        ) : adminSelection && !selectedEvent ? (
          <form className="mt-5 space-y-4" onSubmit={handleAdminBookingSubmit}>
            <div className="flex items-start justify-between rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              <div>
                <p><strong>Time:</strong> {formatDateRange(adminSelection.start, adminSelection.end, communityTz)}</p>
                <p><strong>Amenity:</strong> {amenities.find((a) => a.id === adminSelection.amenityId)?.name}</p>
              </div>
              <button
                type="button"
                onClick={clearAdminSelection}
                className="ml-2 shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                aria-label="Cancel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Name mode radio */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-stone-700">Resident</legend>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="nameMode"
                  value="resident"
                  checked={nameMode === 'resident'}
                  onChange={() => setNameMode('resident')}
                />
                Link to resident
              </label>
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="radio"
                  name="nameMode"
                  value="manual"
                  checked={nameMode === 'manual'}
                  onChange={() => setNameMode('manual')}
                />
                Enter name manually
              </label>
            </fieldset>

            {nameMode === 'resident' ? (
              <label className="block text-sm font-medium text-stone-700">
                Select resident
                <select
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-500"
                  value={bookingForm.residentId}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, residentId: e.target.value }))}
                >
                  <option value="">-- Choose a resident --</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.email})
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <>
              <label className="block text-sm font-medium text-stone-700">
                Name
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-500"
                  type="text"
                  placeholder="Guest or resident name"
                  value={bookingForm.bookedByName}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, bookedByName: e.target.value }))}
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-amber-500"
                  type="email"
                  placeholder="guest@example.com"
                  value={bookingForm.bookedByEmail}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, bookedByEmail: e.target.value }))}
                />
              </label>

              <label className="block text-sm font-medium text-stone-700">
                Phone
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-amber-500"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={bookingForm.bookedByPhone}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, bookedByPhone: e.target.value }))}
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={bookingForm.sendCommsToBookee}
                  onChange={(e) => setBookingForm((prev) => ({ ...prev, sendCommsToBookee: e.target.checked }))}
                  className="rounded"
                />
                Send booking emails to this person
              </label>
              </>
            )}

            <label className="block text-sm font-medium text-stone-700">
              Guest count
              <input
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-500"
                min={1}
                type="number"
                value={bookingForm.guestCount}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, guestCount: Number(e.target.value) }))}
              />
            </label>

            <label className="block text-sm font-medium text-stone-700">
              Notes
              <textarea
                className="mt-2 min-h-20 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-500"
                placeholder="Any additional context"
                value={bookingForm.notes}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </label>

            {/* Suggested amenities */}
            {(() => {
              const selectedAmenity = amenities.find((a) => a.id === adminSelection.amenityId)
              const suggestions = selectedAmenity?.suggestedAmenityIds?.length
                ? amenities.filter((a) => selectedAmenity.suggestedAmenityIds!.includes(a.id))
                : []
              return suggestions.length > 0 ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Also book together:</p>
                  <div className="mt-2 space-y-2">
                    {suggestions.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 text-sm text-stone-700">
                        <input
                          type="checkbox"
                          checked={adminAdditionalAmenities.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) setAdminAdditionalAmenities((p) => [...p, a.id])
                            else setAdminAdditionalAmenities((p) => p.filter((id) => id !== a.id))
                          }}
                          className="rounded"
                        />
                        {a.name}
                        {(a.rentalFee ?? 0) > 0 && <span className="text-xs text-stone-400">(${a.rentalFee})</span>}
                      </label>
                    ))}
                  </div>
                </div>
              ) : null
            })()}

            <label className="flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={bookingForm.feeWaived}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, feeWaived: e.target.checked }))}
                className="rounded"
              />
              Waive booking fees
            </label>

            <label className="flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={bookingForm.anonymous}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, anonymous: e.target.checked }))}
                className="rounded"
              />
              Book anonymously
            </label>

            {/* Booking summary */}
            {(() => {
              const primary = amenities.find((a) => a.id === adminSelection.amenityId)
              if (!primary) return null
              const additional = amenities.filter((a) => adminAdditionalAmenities.includes(a.id))
              const allBooked = [primary, ...additional]
              const totalFee = bookingForm.feeWaived ? 0 : allBooked.reduce((s, a) => s + (a.rentalFee ?? 0), 0)
              const totalDeposit = bookingForm.feeWaived ? 0 : allBooked.reduce((s, a) => s + (a.depositAmount ?? 0), 0)
              return (
                <div className="rounded-2xl border border-stone-200 bg-white p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400 mb-2">Booking Summary</p>
                  <div className="space-y-1">
                    {allBooked.map((a) => (
                      <div key={a.id} className="flex justify-between">
                        <span className="font-medium text-stone-900">{a.name}</span>
                        {bookingForm.feeWaived ? (
                          <span className="text-emerald-600 text-xs font-medium">Waived</span>
                        ) : (a.rentalFee ?? 0) > 0 ? (
                          <span className="text-stone-600">${a.rentalFee}</span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-medium">Free</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 border-t border-stone-100 pt-2 text-xs text-stone-500">
                    <div className="flex justify-between">
                      <span>Time</span>
                      <span className="text-stone-700">{formatDateRange(adminSelection.start, adminSelection.end, communityTz)}</span>
                    </div>
                    {!bookingForm.feeWaived && totalFee > 0 && (
                      <div className="flex justify-between font-semibold text-stone-900 text-sm pt-1 mt-1 border-t border-stone-100">
                        <span>Total</span>
                        <span>${totalFee + totalDeposit}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button
              className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
              disabled={adminSubmitting || (nameMode === 'resident' ? !bookingForm.residentId : !bookingForm.bookedByName.trim())}
              type="submit"
            >
              {adminSubmitting ? 'Creating booking...' : 'Create booking'}
            </button>
          </form>
        ) : selectedEvent && isTurnWindow ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <p><strong>Amenity:</strong> {selectedEvent.extendedProps.amenityName}</p>
              <p><strong>Window:</strong> {formatDateRange(selectedEvent.start, selectedEvent.end, communityTz)}</p>
              <p className="text-[10px] text-stone-300 font-mono mt-1">{selectedEvent.extendedProps.turnWindowId}</p>
              <p>
                <strong>Cleaning status:</strong>{' '}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  selectedEvent.extendedProps.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedEvent.extendedProps.status === 'SCHEDULED'
                      ? 'bg-stone-800 text-white'
                      : 'bg-stone-200 text-stone-600'
                }`}>
                  {selectedEvent.extendedProps.status === 'COMPLETED' ? 'Done' :
                   selectedEvent.extendedProps.status === 'SCHEDULED' ? 'Confirmed' : 'Default (unconfirmed)'}
                </span>
              </p>
            </div>

            <p className="text-sm text-stone-600">
              {selectedEvent.extendedProps.status === 'PENDING'
                ? 'Default cleaning block. Drag or resize to adjust, then confirm the window.'
                : selectedEvent.extendedProps.status === 'SCHEDULED'
                  ? 'Cleaning window confirmed. Mark complete when finished.'
                  : 'Cleaning complete.'}
            </p>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {selectedEvent.extendedProps.status === 'PENDING' && (
              <button
                className="w-full rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-stone-400"
                disabled={busy}
                onClick={confirmTurnWindow}
                type="button"
              >
                {busy ? 'Working...' : 'Confirm cleaning window'}
              </button>
            )}

            {selectedEvent.extendedProps.status === 'SCHEDULED' && (
              <button
                className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:bg-emerald-300"
                disabled={busy}
                onClick={completeTurnWindow}
                type="button"
              >
                {busy ? 'Working...' : 'Mark cleaning complete'}
              </button>
            )}
          </div>
        ) : selectedEvent && isBooking ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <p><strong>Resident:</strong> {selectedEvent.extendedProps.residentName}</p>
              <p><strong>Email:</strong> {selectedEvent.extendedProps.residentEmail}</p>
              <p><strong>Unit:</strong> {selectedEvent.extendedProps.unitNumber}</p>
              <p><strong>Guests:</strong> {selectedEvent.extendedProps.guestCount}</p>
              <p><strong>When:</strong> {formatDateRange(selectedEvent.start, selectedEvent.end, communityTz)}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="font-medium text-amber-700">
                  {selectedEvent.extendedProps.status.replaceAll('_', ' ')}
                </span>
              </p>
              <p className="mt-1 text-[10px] text-stone-300 font-mono">{getRealBookingId()}</p>
            </div>

            {/* Badges for special booking flags */}
            <div className="flex flex-wrap gap-2">
              {selectedEvent.extendedProps.feeWaived && (
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Fee waived
                </span>
              )}
              {selectedEvent.extendedProps.anonymous && (
                <span className="inline-flex items-center rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-800">
                  Anonymous
                </span>
              )}
              {selectedEvent.extendedProps.bookedByName && (
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                  Booked for: {selectedEvent.extendedProps.bookedByName}
                </span>
              )}
              {selectedEvent.extendedProps.createdByName && (
                <span className="inline-flex items-center rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                  Created by: {selectedEvent.extendedProps.createdByName}
                </span>
              )}
            </div>

            {selectedEvent.extendedProps.status === 'PENDING_APPROVAL' ? (
              <>
                <label className="block text-sm font-medium text-stone-700">
                  Denial reason
                  <textarea
                    className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-amber-500"
                    placeholder="Explain why the request cannot be approved."
                    value={denialReason}
                    onChange={(e) => setDenialReason(e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-3 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={waiveFee}
                    onChange={(e) => setWaiveFee(e.target.checked)}
                    className="rounded"
                  />
                  Waive booking fees
                  <span className="text-xs text-stone-400">(resident won't be charged)</span>
                </label>

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:bg-emerald-300"
                    disabled={busy}
                    onClick={approveBooking}
                    type="button"
                  >
                    {busy ? 'Working...' : (waiveFee ? 'Approve (fee waived)' : 'Approve')}
                  </button>
                  <button
                    className="flex-1 rounded-full bg-stone-900 px-4 py-3 text-sm font-semibold text-white disabled:bg-stone-400"
                    disabled={busy || denialReason.trim().length < 3}
                    onClick={denyBooking}
                    type="button"
                  >
                    Deny
                  </button>
                </div>
              </>
            ) : (
              <>
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}
                <button
                  className="w-full rounded-full border border-red-300 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  disabled={busy}
                  onClick={cancelBooking}
                  type="button"
                >
                  {busy ? 'Cancelling...' : 'Cancel booking'}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-stone-500">
              {sidebarMode === 'idle'
                ? 'Select an event on the calendar, or choose an action:'
                : sidebarMode === 'book-on-behalf'
                  ? 'Now drag a time slot on the calendar to book on behalf of a resident.'
                  : 'Now drag a time slot on the calendar to add a cleaning block.'}
            </p>

            <button
              className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                sidebarMode === 'book-on-behalf'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
              onClick={() => setSidebarMode(sidebarMode === 'book-on-behalf' ? 'idle' : 'book-on-behalf')}
              type="button"
            >
              {sidebarMode === 'book-on-behalf' ? '✓ Book on behalf — drag a slot' : 'Book on behalf'}
            </button>

            <button
              className={`w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                sidebarMode === 'cleaning-block'
                  ? 'bg-emerald-600 text-white'
                  : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
              }`}
              onClick={() => setSidebarMode(sidebarMode === 'cleaning-block' ? 'idle' : 'cleaning-block')}
              type="button"
            >
              {sidebarMode === 'cleaning-block' ? '✓ Cleaning block — drag a slot' : 'Add cleaning block'}
            </button>

            {sidebarMode !== 'idle' && (
              <button
                className="w-full text-xs text-stone-400 hover:text-stone-600"
                onClick={() => setSidebarMode('idle')}
                type="button"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}
