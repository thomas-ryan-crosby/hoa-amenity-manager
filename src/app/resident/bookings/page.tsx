'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatDateRange } from '@/lib/format'

type Booking = {
  id: string
  amenityName: string
  startDatetime: string
  endDatetime: string
  guestCount: number
  status: string
  createdAt: string
}

const STATUS_STYLES: Record<string, string> = {
  INQUIRY_RECEIVED: 'bg-stone-200 text-stone-700',
  AVAILABILITY_CHECKING: 'bg-stone-200 text-stone-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
  PAYMENT_PENDING: 'bg-violet-100 text-violet-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  REMINDER_SENT: 'bg-emerald-100 text-emerald-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-stone-200 text-stone-600',
  CLOSED: 'bg-stone-200 text-stone-600',
  DENIED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-700',
  PAYMENT_FAILED: 'bg-red-100 text-red-700',
  WAITLISTED: 'bg-sky-100 text-sky-800',
}

const STATUS_LABELS: Record<string, string> = {
  INQUIRY_RECEIVED: 'Submitted',
  AVAILABILITY_CHECKING: 'Checking',
  PENDING_APPROVAL: 'Pending Approval',
  PAYMENT_PENDING: 'Awaiting Payment',
  CONFIRMED: 'Confirmed',
  REMINDER_SENT: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
  DENIED: 'Denied',
  CANCELLED: 'Cancelled',
  PAYMENT_FAILED: 'Payment Failed',
  WAITLISTED: 'Waitlisted',
}

const CANCELLABLE = [
  'INQUIRY_RECEIVED',
  'AVAILABILITY_CHECKING',
  'PENDING_APPROVAL',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'REMINDER_SENT',
  'WAITLISTED',
]

const MODIFIABLE = [
  'INQUIRY_RECEIVED',
  'PENDING_APPROVAL',
  'PAYMENT_PENDING',
  'WAITLISTED',
]

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function loadBookings() {
    try {
      const res = await fetch('/api/bookings')
      const data = await res.json()
      setBookings(data.bookings ?? [])
    } catch (err) {
      console.error('Failed to load bookings', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [])

  async function cancelBooking(id: string, amenityName: string) {
    if (!confirm(`Cancel your booking for ${amenityName}? Refund is based on the amenity's cancellation policy.`)) return
    setBusy(id)
    setNotice(null)
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        setNotice(data.error ?? 'Unable to cancel.')
        return
      }
      setNotice('Booking cancelled.')
      await loadBookings()
    } catch {
      setNotice('Unable to cancel.')
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold text-stone-900">My bookings</h1>
        <p className="mt-2 text-sm text-stone-500">
          Track your reservations, modify upcoming bookings, or cancel if plans change.
        </p>

        {notice && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center">
            <p className="text-stone-500">No bookings yet.</p>
            <Link
              href="/resident"
              className="mt-3 inline-block rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Book an amenity
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {bookings.map((booking) => {
              const canCancel = CANCELLABLE.includes(booking.status)
              const canModify = MODIFIABLE.includes(booking.status)
              const isPast = new Date(booking.endDatetime) < new Date()

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-stone-900">
                          {booking.amenityName}
                        </h2>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[booking.status] ?? 'bg-stone-200 text-stone-700'}`}>
                          {STATUS_LABELS[booking.status] ?? booking.status.replaceAll('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-stone-600">
                        {formatDateRange(booking.startDatetime, booking.endDatetime)}
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {booking.guestCount} guest{booking.guestCount !== 1 ? 's' : ''} — booked {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {!isPast && (canCancel || canModify) && (
                      <div className="flex flex-wrap gap-2">
                        {canModify && (
                          <Link
                            href={`/resident?modify=${booking.id}`}
                            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                          >
                            Modify
                          </Link>
                        )}
                        {canCancel && (
                          <button
                            className="rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                            disabled={busy === booking.id}
                            onClick={() => cancelBooking(booking.id, booking.amenityName)}
                            type="button"
                          >
                            {busy === booking.id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
