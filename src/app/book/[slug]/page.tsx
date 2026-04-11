'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type ExternalAmenity = {
  id: string
  name: string
  description: string | null
  capacity: number
  externalRentalFee: number
  externalDepositAmount: number
  rentalFee: number
  depositAmount: number
}

type CommunityInfo = {
  name: string
  city: string | null
  state: string | null
}

export default function ExternalBookingPage() {
  const params = useParams()
  const slug = params.slug as string
  const [community, setCommunity] = useState<CommunityInfo | null>(null)
  const [amenities, setAmenities] = useState<ExternalAmenity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Booking form
  const [selectedAmenity, setSelectedAmenity] = useState<string>('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/book/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('Community not found')
        return r.json()
      })
      .then((d) => {
        setCommunity(d.community)
        setAmenities(d.amenities ?? [])
        if (d.amenities?.length === 1) setSelectedAmenity(d.amenities[0].id)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [slug])

  const amenity = amenities.find((a) => a.id === selectedAmenity)
  const fee = amenity ? (amenity.externalRentalFee > 0 ? amenity.externalRentalFee : amenity.rentalFee) : 0
  const deposit = amenity ? (amenity.externalDepositAmount > 0 ? amenity.externalDepositAmount : amenity.depositAmount) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAmenity || !date || !startTime || !endTime) return
    setSubmitting(true)
    setError(null)

    try {
      const startDatetime = `${date}T${startTime}:00`
      const endDatetime = `${date}T${endTime}:00`

      const res = await fetch(`/api/book/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amenityId: selectedAmenity,
          startDatetime,
          endDatetime,
          guestCount,
          guestName,
          guestEmail,
          guestPhone: guestPhone || null,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unable to submit booking')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit booking')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="h-64 w-80 animate-pulse rounded-3xl bg-stone-100" />
      </main>
    )
  }

  if (error && !community) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-4 text-2xl font-bold text-stone-900">Community not found</h1>
          <p className="mt-3 text-sm text-stone-500">This booking page doesn't exist or is no longer available.</p>
          <Link href="/" className="mt-6 inline-block text-sm text-emerald-600 font-medium">Go to Neighbri</Link>
        </div>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-stone-900">Booking request submitted!</h1>
          <p className="mt-3 text-sm text-stone-500">
            Your booking request for {community?.name} has been submitted.
            You'll receive a confirmation email at <strong>{guestEmail}</strong> once it's been reviewed.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
        <h1 className="mt-3 text-2xl font-bold text-stone-900">Book at {community?.name}</h1>
        {community?.city && community?.state && (
          <p className="mt-1 text-sm text-stone-500">{community.city}, {community.state}</p>
        )}
        <p className="mt-2 text-sm text-stone-500">
          Reserve an amenity as a guest. A community administrator will review your request.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {/* Amenity selection */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Select amenity
              <select
                required
                value={selectedAmenity}
                onChange={(e) => setSelectedAmenity(e.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Choose an amenity...</option>
                {amenities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} {fee > 0 ? `— $${a.externalRentalFee > 0 ? a.externalRentalFee : a.rentalFee}` : '— Free'}
                  </option>
                ))}
              </select>
            </label>

            {amenity?.description && (
              <p className="text-xs text-stone-500">{amenity.description}</p>
            )}

            {amenity && (fee > 0 || deposit > 0) && (
              <div className="rounded-xl bg-stone-50 px-4 py-3 text-sm text-stone-600">
                {fee > 0 && <p>Rental fee: <strong>${fee}</strong></p>}
                {deposit > 0 && <p>Security deposit: <strong>${deposit}</strong></p>}
              </div>
            )}
          </div>

          {/* Date & time */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
            <label className="block text-sm font-medium text-stone-700">
              Date
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-stone-700">
                Start time
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                End time
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          {/* Guest info */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">Your information</p>
            <label className="block text-sm font-medium text-stone-700">
              Full name
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Email
              <input
                type="email"
                required
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Phone (optional)
              <input
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-stone-700">
                Guest count
                <input
                  type="number"
                  required
                  min={1}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                />
              </label>
            </div>
            <label className="block text-sm font-medium text-stone-700">
              Notes (optional)
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Event type, special requests, etc."
                className="mt-2 w-full min-h-20 rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedAmenity}
            className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
          >
            {submitting ? 'Submitting...' : 'Request booking'}
          </button>

          <p className="text-center text-xs text-stone-400">
            Powered by <a href="https://neighbri.com" className="text-emerald-600">Neighbri</a>
          </p>
        </form>
      </div>
    </main>
  )
}
