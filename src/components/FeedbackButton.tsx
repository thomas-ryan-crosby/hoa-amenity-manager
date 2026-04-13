'use client'

import { useState } from 'react'

type FeedbackType = 'bug' | 'feature' | 'other'

const TYPE_OPTIONS: { value: FeedbackType; label: string; hint: string }[] = [
  { value: 'bug', label: 'Report a bug', hint: 'Something isn\'t working right' },
  { value: 'feature', label: 'Request a feature', hint: 'Suggest an improvement' },
  { value: 'other', label: 'Other feedback', hint: 'General thoughts or questions' },
]

export function FeedbackButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setMessage('')
    setType('bug')
    setError('')
    setSuccess(false)
  }

  function closeModal() {
    setOpen(false)
    // Defer the reset slightly so the modal animates out without visual flicker
    setTimeout(reset, 200)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 5) {
      setError('Please enter a message with at least 5 characters.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? 'Unable to submit feedback.')
      }
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit feedback.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? 'flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50'
            : 'flex items-center gap-1.5 rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50'
        }
        aria-label="Send feedback"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        Feedback
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Send feedback</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Noticed a bug or have an idea? We read every message.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="mt-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-medium text-stone-900">Thanks! Feedback sent.</p>
                <p className="mt-1 text-sm text-stone-500">We&apos;ll review it shortly.</p>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-5 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Close
                </button>
              </div>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                        type === opt.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="feedback-type"
                        value={opt.value}
                        checked={type === opt.value}
                        onChange={() => setType(opt.value)}
                        className="mt-1 accent-emerald-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-stone-900">{opt.label}</p>
                        <p className="text-xs text-stone-500">{opt.hint}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <label className="block text-sm font-medium text-stone-700">
                  Message
                  <textarea
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-500"
                    rows={5}
                    placeholder={type === 'bug'
                      ? 'What were you trying to do? What happened instead?'
                      : type === 'feature'
                      ? 'What would you like to see? How would it help?'
                      : 'Let us know what\'s on your mind.'}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    minLength={5}
                    maxLength={5000}
                  />
                </label>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting || message.trim().length < 5}
                    className="flex-1 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
                  >
                    {submitting ? 'Sending...' : 'Send feedback'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
