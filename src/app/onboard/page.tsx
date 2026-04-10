'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'

export default function OnboardPage() {
  const [step, setStep] = useState<'plan' | 'details'>('plan')
  const [plan, setPlan] = useState('standard')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [timezone, setTimezone] = useState('America/Chicago')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Listen for Stripe pricing table checkout completion
  // Stripe redirects back or fires events — for now, provide a manual "Continue" button
  // after the user views the pricing table
  useEffect(() => {
    // Check URL params for Stripe success redirect
    const params = new URLSearchParams(window.location.search)
    const selectedPlan = params.get('plan')
    if (selectedPlan) {
      setPlan(selectedPlan)
      setStep('details')
    }
  }, [])

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

      window.location.href = '/admin/dashboard'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/join" className="text-sm text-emerald-700 hover:text-emerald-900">&larr; Back to join</Link>

        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-3 text-3xl font-semibold text-stone-900">
            {step === 'plan' ? 'Choose your plan' : 'Community details'}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            {step === 'plan'
              ? 'Turn your amenities into a revenue stream. All plans include a 30-day free trial.'
              : 'Tell us about your community. You can update this later.'}
          </p>
        </div>

        {/* Step 1: Stripe Pricing Table */}
        {step === 'plan' && (
          <div className="mt-8">
            <Script
              async
              src="https://js.stripe.com/v3/pricing-table.js"
              strategy="afterInteractive"
            />
            <div
              dangerouslySetInnerHTML={{
                __html: `<stripe-pricing-table pricing-table-id="prctbl_1TKlPEBBuISOmksbDQTkGmEh" publishable-key="pk_live_51RMEL2BBuISOmksbi0eTOMmSGCf1ZK7nqQnMAAmN6PYJn7SoyeIuJCEhiXQVaINCI99DZqEo3UeV4P56dXf7yriG00OGztty8j"></stripe-pricing-table>`,
              }}
            />

            <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 text-center">
              <p className="text-sm text-stone-600">
                Already completed checkout? Continue to set up your community.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => { setPlan('standard'); setStep('details') }}
                  className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Continue with Essentials
                </button>
                <button
                  onClick={() => { setPlan('growth'); setStep('details') }}
                  className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
                >
                  Continue with Growth
                </button>
                <button
                  onClick={() => { setPlan('premium'); setStep('details') }}
                  className="rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
                >
                  Continue with Enterprise
                </button>
              </div>
            </div>
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
                {loading ? 'Creating community...' : 'Create community'}
              </button>
            </div>

            <p className="text-center text-xs text-stone-400">
              By creating a community you agree to the <a href="/terms" target="_blank" className="text-emerald-600 underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-emerald-600 underline">Privacy Policy</a>.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
