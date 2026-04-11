'use client'

import Link from 'next/link'

export default function GetStartedPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">What brings you here?</h1>
          <p className="mt-2 text-sm text-stone-500">Choose how you want to use Neighbri.</p>
        </div>

        <div className="space-y-4">
          {/* Join a community */}
          <Link
            href="/join"
            className="block rounded-2xl border-2 border-stone-200 bg-white p-6 hover:border-emerald-400 hover:bg-emerald-50 transition group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">🏠</span>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-800">I'm a resident</h2>
                <p className="mt-1 text-sm text-stone-500 leading-relaxed">
                  Join your community to browse and book amenities like the clubhouse, pool, tennis courts, and more.
                </p>
              </div>
            </div>
          </Link>

          {/* Start a community */}
          <Link
            href="/onboard"
            className="block rounded-2xl border-2 border-stone-200 bg-white p-6 hover:border-emerald-400 hover:bg-emerald-50 transition group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚙️</span>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-800">I manage a community</h2>
                <p className="mt-1 text-sm text-stone-500 leading-relaxed">
                  Set up your HOA on Neighbri and start managing amenity bookings, payments, and scheduling for your residents.
                </p>
              </div>
            </div>
          </Link>

          {/* Browse & book as guest */}
          <Link
            href="/browse"
            className="block rounded-2xl border-2 border-stone-200 bg-white p-6 hover:border-emerald-400 hover:bg-emerald-50 transition group"
          >
            <div className="flex items-start gap-4">
              <span className="text-3xl">🎾</span>
              <div>
                <h2 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-800">I want to book as a guest</h2>
                <p className="mt-1 text-sm text-stone-500 leading-relaxed">
                  Browse amenities open to the public and book pools, courts, event spaces, and more at communities near you.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
