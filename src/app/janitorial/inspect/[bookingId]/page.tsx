'use client'

import { FormEvent, use, useState } from 'react'

export default function InspectionPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = use(params)
  const [status, setStatus] = useState<'PASS' | 'FLAG'>('PASS')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/bookings/${bookingId}/inspection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes,
          photos: photoUrl ? [photoUrl] : [],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Unable to submit inspection.')
      }

      setMessage(`Inspection submitted with status ${data.inspectionReport.status}.`)
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'Unable to submit inspection.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
          Post-event inspection
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">
          Booking {bookingId || '...'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">
          Record whether the amenity passed inspection, add notes, and include a
          photo URL when you need to document damage or cleanup issues.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            {(['PASS', 'FLAG'] as const).map((value) => (
              <button
                key={value}
                className={`rounded-2xl border px-4 py-4 text-sm font-semibold ${
                  status === value
                    ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                    : 'border-stone-300 text-stone-700'
                }`}
                onClick={() => setStatus(value)}
                type="button"
              >
                {value === 'PASS' ? 'Pass' : 'Flag issue'}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-stone-700">
            Notes
            <textarea
              className="mt-2 min-h-32 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-cyan-500"
              placeholder="Condition of the space, supplies used, damage observed, or follow-up needed"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-stone-700">
            Photo URL
            <input
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none transition focus:border-cyan-500"
              placeholder="https://example.com/photo.jpg"
              type="url"
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
            />
          </label>

          {message ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
              {message}
            </div>
          ) : null}

          <button
            className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-stone-400"
            disabled={submitting || !bookingId}
            type="submit"
          >
            {submitting ? 'Submitting...' : 'Submit inspection'}
          </button>
        </form>
      </div>
    </main>
  )
}
