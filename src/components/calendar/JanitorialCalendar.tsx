'use client'

import { useEffect, useState } from 'react'
import { formatDateRange } from '@/lib/format'

type JobEvent = {
  id: string
  start: string
  end: string
  extendedProps: {
    amenityName: string
    status: string
    inspectionNeeded: boolean
    inspectionStatus: string | null
  }
}

export function JanitorialCalendar() {
  const [events, setEvents] = useState<JobEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadJobs() {
      try {
        const response = await fetch('/api/calendar/events?role=janitorial')
        const data = await response.json()
        setEvents(data.events ?? [])
      } catch (error) {
        console.error('Failed to load janitorial jobs', error)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  if (loading) {
    return <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
  }

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-600">
          No janitorial jobs are scheduled right now.
        </div>
      ) : null}

      {events.map((event) => (
        <article
          key={event.id}
          className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                {event.extendedProps.inspectionNeeded ? 'Inspection Needed' : 'Upcoming Job'}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-stone-900">
                {event.extendedProps.amenityName}
              </h2>
              <p className="mt-2 text-sm text-stone-600">
                {formatDateRange(event.start, event.end)}
              </p>
            </div>

            <a
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
              href={`/janitorial/inspect/${event.id}`}
            >
              {event.extendedProps.inspectionNeeded ? 'Complete inspection' : 'Open checklist'}
            </a>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-stone-600">
            <li>Unlock facility and verify setup access.</li>
            <li>Check supplies, seating, and restroom readiness.</li>
            <li>Submit a pass or flag report after the event.</li>
          </ul>
        </article>
      ))}
    </div>
  )
}
