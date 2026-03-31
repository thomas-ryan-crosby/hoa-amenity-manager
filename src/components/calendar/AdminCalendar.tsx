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
    () => events.find((e) => e.id === selectedId) ?? null,
    [events, selectedId],
  )

  const isTurnWindow = selectedEvent?.extendedProps.type === 'turn-window'
  const isBooking = selectedEvent?.extendedProps.type === 'booking'

  async function approveBooking() {
    if (!selectedEvent) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${selectedEvent.id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Unable to approve.')
      await loadEvents()
      setSelectedId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to approve.')
    } finally {
      setBusy(false)
    }
  }

  async function denyBooking() {
    if (!selectedEvent) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${selectedEvent.id}/deny`, {
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
    if (!selectedEvent) return
    if (!confirm('Cancel this booking? The resident will be notified and any applicable refund will be processed.')) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/bookings/${selectedEvent.id}/cancel`, { method: 'POST' })
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

  if (loading) {
    return <div className="h-[640px] animate-pulse rounded-3xl bg-stone-100" />
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="rolling3Day"
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
          events={events}
          editable={false}
          eventStartEditable
          eventDurationEditable
          eventClick={(info) => {
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
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          height="auto"
        />
      </div>

      <aside className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
          {isTurnWindow ? 'Cleaning Window' : 'Booking Review'}
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-900">
          {selectedEvent ? selectedEvent.extendedProps.amenityName : 'Select an event'}
        </h2>

        {selectedEvent && isTurnWindow ? (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
              <p><strong>Amenity:</strong> {selectedEvent.extendedProps.amenityName}</p>
              <p><strong>Window:</strong> {formatDateRange(selectedEvent.start, selectedEvent.end)}</p>
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
                ? 'This is a default cleaning block. Drag or resize to confirm the actual window.'
                : selectedEvent.extendedProps.status === 'SCHEDULED'
                  ? 'This cleaning window has been confirmed. You can still adjust it by dragging.'
                  : 'This cleaning window is complete.'}
            </p>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {selectedEvent.extendedProps.status !== 'COMPLETED' && (
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
                    className="mt-2 min-h-28 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none transition focus:border-amber-500"
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
            Click any event to inspect details. Drag cleaning blocks to adjust turn windows.
          </div>
        )}
      </aside>
    </div>
  )
}
