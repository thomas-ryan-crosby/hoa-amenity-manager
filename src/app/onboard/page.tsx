'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    id: 'standard',
    name: 'Essentials',
    price: '$29',
    period: '/mo',
    features: ['Up to 5 amenities', 'Up to 100 members', 'Booking calendar', 'Email notifications', 'Approval workflows', 'Waitlist management', 'Stripe payments'],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$99',
    period: '/mo',
    popular: true,
    features: ['Up to 20 amenities', 'Up to 1,000 members', 'Outside/guest bookings', 'Revenue reporting', 'Janitorial scheduling', 'Access instructions', 'Booking insights', 'Up to 5 admins'],
  },
  {
    id: 'premium',
    name: 'Enterprise',
    price: '$249',
    period: '/mo',
    features: ['Unlimited amenities', 'Unlimited members', 'Everything in Growth', 'Custom branding', 'Priority support', 'Dedicated onboarding', 'API access', 'Unlimited admins'],
  },
]

export default function OnboardPage() {
  const [step, setStep] = useState<'plan' | 'details'>('plan')
  const [plan, setPlan] = useState('free')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, address, city, state, zip, timezone, plan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Unable to create community')

      // Redirect to admin dashboard
      window.location.href = '/admin/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/join" className="text-sm text-emerald-700 hover:text-emerald-900">&larr; Back to join</Link>

        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">
            {step === 'plan' ? 'Choose your plan' : 'Community details'}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {step === 'plan'
              ? 'Turn your amenities into a revenue stream. Like ResortPass, but for your community.'
              : 'Tell us about your community. You can update this later.'}
          </p>
          {step === 'plan' && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5">
              <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <span className="text-sm font-medium text-emerald-700">30-day free trial on all plans</span>
            </div>
          )}
        </div>

        {/* Step 1: Plan selection */}
        {step === 'plan' && (
          <div className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  className={`relative rounded-2xl border-2 p-5 text-left transition ${
                    plan === p.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      Popular
                    </span>
                  )}
                  <p className="text-lg font-bold text-stone-900">{p.name}</p>
                  <p className="mt-1">
                    <span className="text-2xl font-bold text-stone-900">{p.price}</span>
                    <span className="text-sm text-stone-500">{p.period}</span>
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-stone-600">
                        <svg className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('details')}
              className="mt-6 w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Continue with {PLANS.find((p) => p.id === plan)?.name} plan
            </button>
          </div>
        )}

        {/* Step 2: Community details */}
        {step === 'details' && (
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Community Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sunset Ridge HOA"
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                    placeholder="TX"
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Zip</label>
                  <input
                    type="text"
                    required
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    maxLength={10}
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Timezone</label>
                <select
                  required
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="America/New_York">Eastern</option>
                  <option value="America/Chicago">Central</option>
                  <option value="America/Denver">Mountain</option>
                  <option value="America/Los_Angeles">Pacific</option>
                  <option value="America/Anchorage">Alaska</option>
                  <option value="Pacific/Honolulu">Hawaii</option>
                </select>
              </div>
            </div>

            {/* Plan summary */}
            <div className="rounded-2xl bg-stone-100 px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">
                  {PLANS.find((p) => p.id === plan)?.name} Plan
                </p>
                <p className="text-xs text-stone-500">
                  {PLANS.find((p) => p.id === plan)?.price}{PLANS.find((p) => p.id === plan)?.period}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep('plan')}
                className="text-xs text-emerald-600 font-medium hover:text-emerald-700"
              >
                Change plan
              </button>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('plan')}
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
              >
                {loading ? 'Creating community...' : 'Start 30-day free trial'}
              </button>
            </div>

            <p className="text-center text-xs text-stone-400">
              By creating a community you agree to the <a href="/terms" className="text-emerald-600 underline">Terms of Service</a> and <a href="/privacy" className="text-emerald-600 underline">Privacy Policy</a>.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
