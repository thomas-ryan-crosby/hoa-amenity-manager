'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'

type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  color: string
  editable: boolean
  extendedProps: {
    type: 'booking' | 'turn-window'
    amenityName: string
    status: string
    turnWindowId?: string
    inspectionNeeded?: boolean
    inspectionStatus?: string | null
  }
}

type SelectedTurnWindow = {
  id: string
  title: string
  status: string
  start: string
  end: string
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',    // amber
  SCHEDULED: '#06B6D4',  // cyan
  COMPLETED: '#22C55E',  // green
}

const BOOKING_COLOR = '#3B82F6' // blue

export function JanitorialCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTurnWindow, setSelectedTurnWindow] = useState<SelectedTurnWindow | null>(null)
  const [completing, setCompleting] = useState(false)
  const calendarRef = useRef<FullCalendar>(null)

  const loadEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/events?role=janitorial')
      const data = await response.json()
      setEvents(data.events ?? [])
    } catch (error) {
      console.error('Failed to load janitorial events', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const handleEventDrop = useCallback(
    async (info: EventDropArg) => {
      const { event } = info
      const type = event.extendedProps.type as string
      if (type !== 'turn-window') {
        info.revert()
        return
      }

      const turnWindowId = event.extendedProps.turnWindowId as string
      if (!turnWindowId || !event.start || !event.end) {
        info.revert()
        return
      }

      try {
        const res = await fetch(`/api/turn-windows/${turnWindowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actualStart: event.start.toISOString(),
            actualEnd: event.end.toISOString(),
          }),
        })

        if (!res.ok) {
          info.revert()
          console.error('Failed to update turn window after drop')
          return
        }

        // Update color to SCHEDULED
        event.setProp('color', STATUS_COLORS.SCHEDULED)
        event.setExtendedProp('status', 'SCHEDULED')
      } catch {
        info.revert()
        console.error('Failed to update turn window after drop')
      }
    },
    [],
  )

  const handleEventResize = useCallback(
    async (info: EventResizeDoneArg) => {
      const { event } = info
      const type = event.extendedProps.type as string
      if (type !== 'turn-window') {
        info.revert()
        return
      }

      const turnWindowId = event.extendedProps.turnWindowId as string
      if (!turnWindowId || !event.start || !event.end) {
        info.revert()
        return
      }

      try {
        const res = await fetch(`/api/turn-windows/${turnWindowId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actualStart: event.start.toISOString(),
            actualEnd: event.end.toISOString(),
          }),
        })

        if (!res.ok) {
          info.revert()
          console.error('Failed to update turn window after resize')
          return
        }

        event.setProp('color', STATUS_COLORS.SCHEDULED)
        event.setExtendedProp('status', 'SCHEDULED')
      } catch {
        info.revert()
        console.error('Failed to update turn window after resize')
      }
    },
    [],
  )

  const handleEventClick = useCallback((info: EventClickArg) => {
    const { event } = info
    const type = event.extendedProps.type as string

    if (type === 'turn-window') {
      setSelectedTurnWindow({
        id: event.extendedProps.turnWindowId as string,
        title: event.title,
        status: event.extendedProps.status as string,
        start: event.start?.toISOString() ?? '',
        end: event.end?.toISOString() ?? '',
      })
    } else {
      setSelectedTurnWindow(null)
    }
  }, [])

  const handleMarkComplete = useCallback(async () => {
    if (!selectedTurnWindow) return

    setCompleting(true)
    try {
      const res = await fetch(`/api/turn-windows/${selectedTurnWindow.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      })

      if (res.ok) {
        setSelectedTurnWindow(null)
        await loadEvents()
      } else {
        console.error('Failed to mark turn window as complete')
      }
    } catch {
      console.error('Failed to mark turn window as complete')
    } finally {
      setCompleting(false)
    }
  }, [selectedTurnWindow, loadEvents])

  if (loading) {
    return <div className="h-[600px] animate-pulse rounded-3xl bg-stone-100" />
  }

  const calendarEvents = events.map((evt) => ({
    id: evt.id,
    title: evt.title,
    start: evt.start,
    end: evt.end,
    color: evt.extendedProps.type === 'turn-window'
      ? STATUS_COLORS[evt.extendedProps.status] ?? STATUS_COLORS.PENDING
      : BOOKING_COLOR,
    editable: evt.extendedProps.type === 'turn-window' && evt.extendedProps.status !== 'COMPLETED',
    extendedProps: evt.extendedProps,
  }))

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: BOOKING_COLOR }} />
          <span className="text-stone-600">Booking</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.PENDING }} />
          <span className="text-stone-600">Turn Window (Pending)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.SCHEDULED }} />
          <span className="text-stone-600">Turn Window (Scheduled)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS.COMPLETED }} />
          <span className="text-stone-600">Turn Window (Completed)</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
        <FullCalendar
          ref={calendarRef}
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
          events={calendarEvents}
          editable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="08:00:00"
          allDaySlot={false}
          height="auto"
          nowIndicator={true}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
      </div>

      {/* Turn window detail panel */}
      {selectedTurnWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Turn Window
                </p>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">
                  {selectedTurnWindow.title}
                </h3>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor:
                    selectedTurnWindow.status === 'COMPLETED'
                      ? '#DCFCE7'
                      : selectedTurnWindow.status === 'SCHEDULED'
                        ? '#CFFAFE'
                        : '#FEF3C7',
                  color:
                    selectedTurnWindow.status === 'COMPLETED'
                      ? '#166534'
                      : selectedTurnWindow.status === 'SCHEDULED'
                        ? '#155E75'
                        : '#92400E',
                }}
              >
                {selectedTurnWindow.status}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm text-stone-600">
              <p>
                <span className="font-medium text-stone-900">Start:</span>{' '}
                {new Date(selectedTurnWindow.start).toLocaleString()}
              </p>
              <p>
                <span className="font-medium text-stone-900">End:</span>{' '}
                {new Date(selectedTurnWindow.end).toLocaleString()}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              {selectedTurnWindow.status !== 'COMPLETED' && (
                <button
                  onClick={handleMarkComplete}
                  disabled={completing}
                  className="rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  {completing ? 'Completing...' : 'Mark Complete'}
                </button>
              )}
              <button
                onClick={() => setSelectedTurnWindow(null)}
                className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
