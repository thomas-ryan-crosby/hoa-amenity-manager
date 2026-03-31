'use client'

import { useEffect, useMemo, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { formatDateRange } from '@/lib/format'

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  color?: string
  extendedProps: {
    amenityId: string
    amenityName: string
    residentName: string
    residentEmail: string
    unitNumber: string
    guestCount: number
    status: string
  }
}

export function AdminCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [denialReason, setDenialReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadEvents() {
    try {
      const response = await fetch('/api/calendar/events?role=admin')
      const data = await response.json()
      setEvents(data.events ?? [])
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

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedId) ?? null,
    [events, selectedId],
  )

  async function approveBooking() {
    if (!selectedEvent) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/bookings/${selectedEvent.id}/approve`, { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Unable to approve booking.')
      }
      await loadEvents()
      setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve booking.')
    } finally {
      setBusy(false)
    }
  }

  async function denyBooking() {
    if (!selectedEvent) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/bookings/${selectedEvent.id}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: denialReason }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Unable to deny booking.')
      }
      await loadEvents()
      setSelectedId(null)
      setDenialReason('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to deny booking.')
    } finally {
      setBusy(false)
    }
  }

  async function cancelBooking() {
    if (!selectedEvent) return
    if (!confirm('Cancel this booking? The resident will be notified and any applicable refund will be processed.')) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/bookings/${selectedEvent.id}/cancel`, { method: 'POST' })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error ?? 'Unable to cancel booking.')
      }
      await loadEvents()
      setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel booking.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return <div className="h-[640px] animate-pulse rounded-3xl bg-stone-100" />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          events={events}
          eventClick={(info) => {
            setSelectedId(info.event.id)
            setDenialReason('')
            setError(null)
          }}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          height="auto"
        />
      </div>

      <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          Booking Review
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-900">
          {selectedEvent ? selectedEvent.extendedProps.amenityName : 'Select an event'}
        </h2>

        {selectedEvent ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <p><strong>Resident:</strong> {selectedEvent.extendedProps.residentName}</p>
              <p><strong>Email:</strong> {selectedEvent.extendedProps.residentEmail}</p>
              <p><strong>Unit:</strong> {selectedEvent.extendedProps.unitNumber}</p>
              <p><strong>Guests:</strong> {selectedEvent.extendedProps.guestCount}</p>
              <p><strong>When:</strong> {formatDateRange(selectedEvent.start, selectedEvent.end)}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="font-medium text-amber-700">
                  {selectedEvent.extendedProps.status.replaceAll('_', ' ')}
                </span>
              </p>
            </div>

            {selectedEvent.extendedProps.status === 'PENDING_APPROVAL' ? (
              <>
                <label className="block text-sm font-medium text-stone-700">
                  Denial reason
                  <textarea
                    className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-amber-500"
                    placeholder="Explain why the request cannot be approved."
                    value={denialReason}
                    onChange={(e) => setDenialReason(e.target.value)}
                  />
                </label>
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
                )}
                <div className="flex gap-3">
                  <button
                    className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:bg-emerald-300"
                    disabled={busy}
                    onClick={approveBooking}
                    type="button"
                  >
                    {busy ? 'Working...' : 'Approve'}
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
          <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-sm leading-6 text-stone-600">
            Click any event to inspect details and act on pending approvals.
          </div>
        )}
      </aside>
    </div>
  )
}
