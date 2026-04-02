'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { BookingCalendar } from '@/components/calendar/BookingCalendar'
import { Tutorial } from '@/components/Tutorial'
import { HelpButton } from '@/components/HelpButton'

function ResidentContent() {
  const searchParams = useSearchParams()
  const modifyBookingId = searchParams.get('modify')
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Resident Portal
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-900">
            {modifyBookingId ? 'Modify booking' : 'Book an amenity'}
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            {modifyBookingId
              ? 'Select a new time slot below. Once you submit the new booking, the original will be cancelled automatically.'
              : 'Browse confirmed reservations, pick an open slot, and submit a request for review.'}
          </p>
        </div>

        {modifyBookingId && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            You are modifying an existing booking. Select a new time and submit — your original booking will be cancelled and any applicable refund processed.
          </div>
        )}

        <BookingCalendar modifyBookingId={modifyBookingId} />
      </div>

      <Tutorial externalOpen={showTutorial} onClose={() => setShowTutorial(false)} />
      <HelpButton onOpen={() => setShowTutorial(true)} />
    </main>
  )
}

export default function ResidentBookingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <ResidentContent />
    </Suspense>
  )
}
