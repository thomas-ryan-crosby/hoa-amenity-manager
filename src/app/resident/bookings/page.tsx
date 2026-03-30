export const dynamic = 'force-dynamic'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'
import { formatDateRange } from '@/lib/format'

export default async function BookingHistoryPage() {
  const { userId } = await auth()

  const resident = userId
    ? await prisma.resident.findUnique({
        where: { clerkUserId: userId },
      })
    : null

  const bookings = resident
    ? await prisma.booking.findMany({
        where: { residentId: resident.id },
        include: {
          amenity: {
            select: { name: true },
          },
        },
        orderBy: { startDatetime: 'desc' },
      })
    : []

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold text-stone-900">My bookings</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">
          Track request status, review event dates, and keep an eye on the full
          lifecycle from approval through inspection close-out.
        </p>

        <div className="mt-8 space-y-4">
          {bookings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-600">
              No bookings found yet.
            </div>
          ) : null}

          {bookings.map((booking) => (
            <article
              key={booking.id}
              className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-stone-900">
                    {booking.amenity.name}
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    {formatDateRange(booking.startDatetime, booking.endDatetime)}
                  </p>
                </div>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-700">
                  {booking.status.replaceAll('_', ' ')}
                </span>
              </div>

              <p className="mt-4 text-sm text-stone-600">
                Guests: {booking.guestCount}
                {booking.notes ? ` • Notes: ${booking.notes}` : ''}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
