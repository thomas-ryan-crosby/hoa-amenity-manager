'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import dayGridPlugin from '@fullcalendar/daygrid'
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

type CalendarResource = {
  id: string
  title: string
}

type CalendarEvent = {
  id: string
  resourceId?: string
  title: string
  start: string
  end: string
  color?: string
}

type SelectionState = {
  amenityId: string
  start: string
  end: string
}

export function BookingCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [resources, setResources] = useState<CalendarResource[]>([])
  const [amenities, setAmenities] = useState<Amenity[]>([])
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
        setResources(eventsData.resources ?? [])
        setAmenities(amenitiesData.amenities ?? [])
      } catch (loadError) {
        console.error('Failed to load booking calendar', loadError)
        setError('Unable to load calendar data right now.')
      } finally {
        setLoading(false)
      }
    }

    loadCalendar()
  }, [])

  const selectedAmenity = useMemo(
    () => amenities.find((amenity) => amenity.id === selection?.amenityId) ?? null,
    [amenities, selection],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selection) {
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      setSelection(null)
      setGuestCount(1)
      setNotes('')
      alert(`Booking request submitted. Status: ${data.status}`)
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
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <FullCalendar
          plugins={[resourceTimeGridPlugin, interactionPlugin, dayGridPlugin]}
          initialView="resourceTimeGridDay"
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimeGridDay,resourceTimeGridWeek,dayGridMonth',
          }}
          resources={resources}
          events={events}
          selectable
          selectMirror
          select={(info) => {
            if (!info.resource?.id) {
              return
            }

            setSelection({
              amenityId: info.resource.id,
              start: info.startStr,
              end: info.endStr,
            })
            setGuestCount(1)
            setNotes('')
          }}
          eventOverlap={false}
          selectOverlap={false}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          resourceAreaHeaderContent="Amenities"
          height="auto"
        />
      </div>

      <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Request Booking
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-stone-900">
            {selectedAmenity ? selectedAmenity.name : 'Choose an open time slot'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Select a slot in the calendar to open the request form. Confirmed
            bookings are already shown on the calendar.
          </p>
        </div>

        {selection && selectedAmenity ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
              <p className="font-medium text-stone-900">
                {formatDateTime(selection.start)}
              </p>
              <p>{formatDateTime(selection.end)}</p>
              <p className="mt-3">{selectedAmenity.description ?? 'No description yet.'}</p>
              <p className="mt-3">
                Capacity: {selectedAmenity.capacity} guests
              </p>
              <p>
                Fee: {formatCurrency(selectedAmenity.rentalFee)} + deposit{' '}
                {formatCurrency(selectedAmenity.depositAmount)}
              </p>
            </div>

            <label className="block text-sm font-medium text-stone-700">
              Guest count
              <input
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                max={selectedAmenity.capacity}
                min={1}
                type="number"
                value={guestCount}
                onChange={(event) => setGuestCount(Number(event.target.value))}
              />
            </label>

            <label className="block text-sm font-medium text-stone-700">
              Notes
              <textarea
                className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-emerald-500"
                placeholder="Accessibility needs, event type, or any extra context"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
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
            Open slots are requestable directly from the calendar. Pick a date
            and time to see the selected amenity, pricing, and request form here.
          </div>
        )}
      </aside>
    </div>
  )
}
