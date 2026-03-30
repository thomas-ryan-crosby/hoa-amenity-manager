import { BookingCalendar } from '@/components/calendar/BookingCalendar'

export default function ResidentBookingPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Resident Portal
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-900">
            Book an amenity
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            Browse confirmed reservations, pick an open slot, and submit a request
            for review. Payment is collected only after approval or auto-approval.
          </p>
        </div>

        <BookingCalendar />
      </div>
    </main>
  )
}
