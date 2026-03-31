'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { formatCurrency, formatDateTime } from '@/lib/format'

type Amenity = {
  id: string
  name: string
  description: string | null
  capacity: number
  rentalFee: number
  depositAmount: number
  maxAdvanceBookingDays: number
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

export function BookingCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [selectedAmenity, setSelectedAmenity] = useState<string>('')
  const [selection, setSelection] = useState<SelectionState | null>(null)
  const [guestCount, setGuestCount] = useState(1)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCalendar() {
      try {
        const [eventsRes, amenitiesRes] = await Promise.all([
          fetch('/api/calendar/events'),
          fetch('/api/amenities'),
        ])

        const eventsData = await eventsRes.json()
        const amenitiesData = await amenitiesRes.json()

        setEvents(eventsData.events ?? [])
        setAmenities(amenitiesData.amenities ?? [])
        if (amenitiesData.amenities?.length) {
          setSelectedAmenity(amenitiesData.amenities[0].id)
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

  const amenityInfo = useMemo(
    () => amenities.find((a) => a.id === selection?.amenityId) ?? null,
    [amenities, selection],
  )

  // Filter events by selected amenity
  const filteredEvents = useMemo(
    () =>
      selectedAmenity
        ? events.filter(
            (e) => e.extendedProps?.amenityId === selectedAmenity,
          )
        : events,
    [events, selectedAmenity],
  )

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

      setSelection(null)
      setGuestCount(1)
      setNotes('')

      const statusMsg = data.status === 'WAITLISTED'
        ? 'Your booking has been waitlisted because the slot already has an active booking. You will be notified if it opens up.'
        : `Booking request submitted! Status: ${data.status}`
      alert(statusMsg)
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

  if (loading) {
    return <div className="h-[640px] animate-pulse rounded-3xl bg-stone-100" />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div>
        {/* Amenity tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {amenities.map((amenity) => (
            <button
              key={amenity.id}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedAmenity === amenity.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              onClick={() => setSelectedAmenity(amenity.id)}
              type="button"
            >
              {amenity.name}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#9CA3AF]" /> Inquiry
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#F59E0B]" /> Pending Approval
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#8B5CF6]" /> Awaiting Payment
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#3B82F6]" /> Confirmed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-[#FB923C]" /> Waitlisted
          </span>
        </div>

        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            views={{
              timeGridWeek: {
                dateIncrement: { days: 3 },
              },
            }}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridDay,timeGridWeek,dayGridMonth',
            }}
            events={filteredEvents}
            selectable
            selectMirror
            select={(info) => {
              if (!selectedAmenity) return
              setSelection({
                amenityId: selectedAmenity,
                start: info.startStr,
                end: info.endStr,
              })
              setGuestCount(1)
              setNotes('')
            }}
            eventOverlap
            selectOverlap
            slotMinTime="06:00:00"
            slotMaxTime="23:00:00"
            height="auto"
          />
        </div>
      </div>

      <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
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
            <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
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
  )
}
