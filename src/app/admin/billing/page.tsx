'use client'

import { useEffect, useState } from 'react'

type BillingInfo = {
  communityName: string
  plan: string
  maxAmenities: number
  maxMembers: number
  currentAmenities: number
  currentMembers: number
  contactEmail: string | null
}

const PLAN_DETAILS: Record<string, { label: string; color: string; features: string[] }> = {
  free: {
    label: 'Free',
    color: 'bg-stone-100 text-stone-700',
    features: ['Basic amenity booking', 'Email notifications', 'Calendar view'],
  },
  standard: {
    label: 'Standard',
    color: 'bg-emerald-100 text-emerald-700',
    features: [
      'Everything in Free',
      'Stripe payments & deposits',
      'Janitorial assignments',
      'Access instructions',
      'Booking insights',
    ],
  },
  premium: {
    label: 'Premium',
    color: 'bg-purple-100 text-purple-700',
    features: [
      'Everything in Standard',
      'Priority support',
      'Custom branding',
      'Advanced analytics',
      'API access',
    ],
  },
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/billing')
      .then((r) => {
        if (!r.ok) throw new Error('Unable to load billing information')
        return r.json()
      })
      .then((d) => {
        setBilling(d.billing)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const planInfo = billing ? PLAN_DETAILS[billing.plan] ?? PLAN_DETAILS.free : null

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-900">Billing</h1>
          <p className="mt-2 text-sm text-stone-500">
            Plan details and usage for your community.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-32 animate-pulse rounded-2xl bg-stone-200" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error}
          </div>
        ) : billing && planInfo ? (
          <div className="space-y-6">
            {/* Current plan */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    Current Plan
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-stone-900">
                      {planInfo.label}
                    </h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${planInfo.color}`}>
                      {billing.plan}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">
                    {billing.communityName}
                  </p>
                </div>
                <a
                  href="mailto:support@neighbri.com?subject=Plan change request"
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Change plan
                </a>
              </div>

              <div className="mt-5 border-t border-stone-100 pt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-3">
                  Plan Features
                </p>
                <ul className="space-y-2">
                  {planInfo.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                      <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Usage */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-4">
                Usage
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-stone-500">Members</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">
                    {billing.currentMembers}
                    <span className="text-sm font-normal text-stone-400">
                      {' '}/ {billing.maxMembers}
                    </span>
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-stone-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{
                        width: `${Math.min(100, (billing.currentMembers / billing.maxMembers) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Amenities</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">
                    {billing.currentAmenities}
                    <span className="text-sm font-normal text-stone-400">
                      {' '}/ {billing.maxAmenities}
                    </span>
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-stone-100">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{
                        width: `${Math.min(100, (billing.currentAmenities / billing.maxAmenities) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">
                Billing Support
              </p>
              <p className="text-sm text-stone-600">
                To upgrade your plan, adjust limits, or for billing questions, contact us at{' '}
                <a href="mailto:support@neighbri.com" className="text-emerald-600 font-medium">
                  support@neighbri.com
                </a>
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
