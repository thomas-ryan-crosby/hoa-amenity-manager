'use client'

import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { formatCurrency, formatDateTime, formatDateRange } from '@/lib/format'

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
  maxAdvanceBookingDays: number
  areaId: string | null
  sortOrder: number
}

type CalendarEventExtendedProps = {
  amenityId: string
  amenityName: string
  residentName: string
  residentEmail: string
  unitNumber: string
  guestCount: number
  status: string
  inspectionStatus: string | null
  inspectionNeeded: boolean
}

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  color?: string
  extendedProps?: CalendarEventExtendedProps
}

type SelectionState = {
  amenityId: string
  start: string
  end: string
}

const STATUS_LABELS: Record<string, string> = {
  INQUIRY_RECEIVED: 'Inquiry',
  AVAILABILITY_CHECKING: 'Checking',
  PENDING_APPROVAL: 'Pending Approval',
  PAYMENT_PENDING: 'Awaiting Payment',
  CONFIRMED: 'Confirmed',
  REMINDER_SENT: 'Confirmed',
  WAITLISTED: 'Waitlisted',
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  INQUIRY_RECEIVED: 'bg-pink-100 text-pink-800',
  AVAILABILITY_CHECKING: 'bg-pink-100 text-pink-800',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  PAYMENT_PENDING: 'bg-violet-100 text-violet-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  REMINDER_SENT: 'bg-blue-100 text-blue-800',
  WAITLISTED: 'bg-sky-100 text-sky-800',
}

export function BookingCalendar({ modifyBookingId }: { modifyBookingId?: string | null }) {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(new Set())
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [notes, setNotes] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [isMobile, setIsMobile] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)

  function clearSelection() {
    setSelection(null)
    setError(null)
    setAnonymous(false)
    calendarRef.current?.getApi().unselect()
  }

  // Detect mobile
  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function loadCalendar() {
      try {
        const [eventsRes, amenitiesRes] = await Promise.all([
          fetch('/api/calendar/events'),
          fetch('/api/amenities'),
        ])

        if (!amenitiesRes.ok) {
          console.error('Amenities API error:', amenitiesRes.status, await amenitiesRes.text())
        }
        if (!eventsRes.ok) {
          console.error('Events API error:', eventsRes.status, await eventsRes.text())
        }

        const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] }
        const amenitiesData = amenitiesRes.ok ? await amenitiesRes.json() : { amenities: [], areas: [] }

        setEvents(eventsData.events ?? [])
        setAmenities(amenitiesData.amenities ?? [])
        setAreas(amenitiesData.areas ?? [])
        if (amenitiesData.amenities?.length) {
          setSelectedAmenities(new Set([amenitiesData.amenities[0].id]))
        }
      } catch (loadError) {
        console.error('Failed to load booking calendar', loadError)
        setError('Unable to load calendar data right now.')
      } finally {
        setLoading(false)
      }
    }

    loadCalendar()
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

  const amenityInfo = useMemo(
    () => amenities.find((a) => a.id === selection?.amenityId) ?? null,
    [amenities, selection],
  )

  // Filter events by selected amenities
  const filteredEvents = useMemo(
    () =>
      selectedAmenities.size > 0
        ? events.filter(
            (e) => e.extendedProps?.amenityId && selectedAmenities.has(e.extendedProps.amenityId),
          )
        : events,
    [events, selectedAmenities],
  )

  function handleAmenityClick(amenityId: string, e: MouseEvent) {
    clearSelection()
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selection) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: selection.amenityId,
          startDatetime: selection.start,
          endDatetime: selection.end,
          guestCount,
          notes: notes.trim() || undefined,
          anonymous,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to submit booking request.')
      }

      // Reload events to reflect the new booking (or waitlist entry)
      const eventsRes = await fetch('/api/calendar/events')
      const eventsData = await eventsRes.json()
      setEvents(eventsData.events ?? [])

      clearSelection()
      setGuestCount(1)
      setNotes('')

      // If modifying, cancel the original booking
      if (modifyBookingId) {
        await fetch(`/api/bookings/${modifyBookingId}/cancel`, { method: 'POST' }).catch(() => {})
      }

      const statusMsg = modifyBookingId
        ? 'Booking modified! Your original booking has been cancelled.'
        : data.status === 'WAITLISTED'
          ? 'Your booking has been waitlisted because the slot already has an active booking. You will be notified if it opens up.'
          : 'Booking request submitted!'
      alert(statusMsg)

      // If modifying, redirect back to bookings
      if (modifyBookingId) {
        window.location.href = '/resident/bookings'
        return
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit booking request.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Determine which amenity to use for calendar selection (first selected amenity)
  const primaryAmenityId = useMemo(() => {
    const arr = Array.from(selectedAmenities)
    return arr.length > 0 ? arr[0] : ''
  }, [selectedAmenities])

  if (loading) {
    return <div className="h-[640px] animate-pulse rounded-3xl bg-stone-100" />
  }

  // Mobile booking modal
  const mobileModal = isMobile && selection && amenityInfo ? (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) clearSelection() }}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 shadow-xl animate-in slide-in-from-bottom">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Confirm Booking</p>
            <h2 className="mt-1 text-xl font-semibold text-stone-900">{amenityInfo.name}</h2>
          </div>
          <button onClick={clearSelection} className="rounded-full p-2 text-stone-400 hover:bg-stone-100" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700 mb-4">
          <p className="font-medium text-stone-900">{formatDateTime(selection.start)}</p>
          <p>{formatDateTime(selection.end)}</p>
          {amenityInfo.description && <p className="mt-2 text-stone-500">{amenityInfo.description}</p>}
          <p className="mt-2">Capacity: {amenityInfo.capacity} guests</p>
          {(amenityInfo.rentalFee > 0 || amenityInfo.depositAmount > 0) && (
            <p>Fee: {formatCurrency(amenityInfo.rentalFee)} + deposit {formatCurrency(amenityInfo.depositAmount)}</p>
          )}
        </div>

        {filteredEvents.some(
          (e) => new Date(e.start) < new Date(selection.end) && new Date(e.end) > new Date(selection.start),
        ) && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 mb-4">
            This slot has existing bookings. Your request will be <strong>waitlisted</strong>.
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-stone-700">
            Guest count
            <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" max={amenityInfo.capacity} min={1} type="number" value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Notes (optional)
            <textarea className="mt-2 min-h-20 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900" placeholder="Event type, accessibility needs, etc." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <label className="flex items-center gap-3 text-sm text-stone-700">
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="rounded" />
            Book anonymously
          </label>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:bg-emerald-300"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Submitting...' : 'Confirm Booking'}
            </button>
            <button
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
              type="button"
              onClick={clearSelection}
            >
              Adjust
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null

  return (
    <>
    {mobileModal}
    <div className="grid gap-6 grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        {/* Amenity tabs grouped by area + view toggle */}
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
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

        {isMobile && (
          <div className="mb-3 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            <strong>How to book:</strong> Tap and hold on a time slot, then drag to set your duration. A confirmation window will appear.
          </div>
        )}

        <p className="mb-2 text-xs text-stone-400 hidden sm:block">
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
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#E7E5E4]" /> Blocked (linked)
          </span>
        </div>

        {viewMode === 'calendar' ? (
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 sm:p-4 shadow-sm">
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView={isMobile ? 'timeGridDay' : 'rolling3Day'}
              eventDisplay="block"
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
              selectAllow={(info) => {
                // Block all-day selections from month view — navigate to day instead
                return !info.allDay
              }}
              select={(info) => {
                if (!primaryAmenityId) return
                if (info.allDay) return // safety check
                setSelection({
                  amenityId: primaryAmenityId,
                  start: info.startStr,
                  end: info.endStr,
                })
                setGuestCount(1)
                setNotes('')
              }}
              dateClick={(info) => {
                // In month view, clicking a day navigates to that day's time grid
                if (info.view.type === 'dayGridMonth') {
                  calendarRef.current?.getApi().changeView('timeGridDay', info.dateStr)
                }
              }}
              navLinks
              navLinkDayClick={(date) => {
                calendarRef.current?.getApi().changeView('timeGridDay', date)
              }}
              eventOverlap
              selectOverlap
              slotMinTime="00:00:00"
              slotMaxTime="24:00:00"
              scrollTime="08:00:00"
              height="auto"
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
                const status = props?.status ?? ''
                const badgeStyle = STATUS_BADGE_STYLES[status] ?? 'bg-stone-200 text-stone-700'
                const label = STATUS_LABELS[status] ?? status.replaceAll('_', ' ')

                return (
                  <button
                    key={event.id}
                    className="w-full text-left rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    style={{ borderLeftWidth: '4px', borderLeftColor: event.color ?? '#9CA3AF' }}
                    onClick={() => {
                      if (!props?.amenityId) return
                      setSelection({
                        amenityId: props.amenityId,
                        start: event.start,
                        end: event.end,
                      })
                      setGuestCount(props.guestCount ?? 1)
                      setNotes('')
                    }}
                    type="button"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-stone-900">
                          {props?.amenityName ?? event.title}
                        </p>
                        <p className="mt-1 text-sm text-stone-600">
                          {formatDateRange(event.start, event.end)}
                        </p>
                        {props?.guestCount != null && (
                          <p className="mt-1 text-xs text-stone-500">
                            {props.guestCount} guest{props.guestCount !== 1 ? 's' : ''}
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

      <aside className="hidden xl:block rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Request Booking
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            {amenityInfo ? amenityInfo.name : 'Choose an open time slot'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Select an amenity tab, then click and drag a time slot on the
            calendar to start a booking request. If the slot is taken you will
            be placed on the waitlist automatically.
          </p>
        </div>

        {selection && amenityInfo ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex items-start justify-between rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              <div>
                <p className="font-medium text-stone-900">
                  {formatDateTime(selection.start)}
                </p>
                <p>{formatDateTime(selection.end)}</p>
              <p className="mt-3">{amenityInfo.description ?? 'No description yet.'}</p>
              <p className="mt-3">
                Capacity: {amenityInfo.capacity} guests
              </p>
              <p>
                Fee: {formatCurrency(amenityInfo.rentalFee)} + deposit{' '}
                {formatCurrency(amenityInfo.depositAmount)}
              </p>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-2 shrink-0 rounded-full p-1 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                aria-label="Cancel booking"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Show if selected slot already has bookings */}
            {filteredEvents.some(
              (e) =>
                new Date(e.start) < new Date(selection.end) &&
                new Date(e.end) > new Date(selection.start),
            ) && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
                This time slot already has one or more bookings. Your request
                will be <strong>waitlisted</strong> and you will be notified if
                the slot opens up.
              </div>
            )}

            <label className="block text-sm font-medium text-stone-700">
              Guest count
              <input
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                max={amenityInfo.capacity}
                min={1}
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              />
            </label>

            <label className="block text-sm font-medium text-stone-700">
              Notes
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                placeholder="Accessibility needs, event type, or any extra context"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>

            <label className="flex items-center gap-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded"
              />
              Book anonymously
              <span className="text-xs text-stone-400">(your name won't show on the public calendar)</span>
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-300"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Submitting request...' : 'Request Booking'}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm leading-6 text-stone-600">
            Pick an amenity tab above, then click and drag a time slot on the
            calendar to see pricing and the booking form here.
          </div>
        )}
      </aside>
    </div>
    </>
  )
}
