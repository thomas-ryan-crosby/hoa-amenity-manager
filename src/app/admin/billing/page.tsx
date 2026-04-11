'use client'

import { useEffect, useState } from 'react'

type BillingInfo = {
  communityId: string
  communityName: string
  plan: string
  maxAmenities: number
  maxMembers: number
  currentAmenities: number
  currentMembers: number
}

type StripeStatus = {
  connected: boolean
  hasPublishableKey: boolean
  hasSecretKey: boolean
  hasWebhookSecret: boolean
}

const PLAN_PRICING: Record<string, { label: string; price: string; color: string; features: string[] }> = {
  standard: {
    label: 'Essentials',
    price: '$29/mo',
    color: 'bg-stone-100 text-stone-700',
    features: ['Up to 5 amenities', 'Up to 100 members', 'Booking calendar', 'Email notifications', 'Approval workflows', 'Waitlist management', 'Stripe payments'],
  },
  growth: {
    label: 'Growth',
    price: '$99/mo',
    color: 'bg-emerald-100 text-emerald-700',
    features: ['Up to 20 amenities', 'Up to 1,000 members', 'Outside/guest bookings', 'Revenue reporting', 'Janitorial scheduling', 'Access instructions', 'Booking insights', 'Up to 5 admins'],
  },
  premium: {
    label: 'Enterprise',
    price: '$249/mo',
    color: 'bg-purple-100 text-purple-700',
    features: ['Unlimited amenities', 'Unlimited members', 'Everything in Growth', 'Custom branding', 'Priority support', 'Dedicated onboarding', 'API access', 'Unlimited admins'],
  },
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [stripe, setStripe] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stripe config form
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/billing')
      .then((r) => {
        if (!r.ok) throw new Error('Unable to load billing information')
        return r.json()
      })
      .then((d) => {
        setBilling(d.billing)
        setStripe(d.stripe)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  async function saveStripeConfig(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    setError(null)
    try {
      const body: Record<string, string> = {}
      if (publishableKey.trim()) body.stripePublishableKey = publishableKey.trim()
      if (secretKey.trim()) body.stripeSecretKey = secretKey.trim()
      if (webhookSecret.trim()) body.stripeWebhookSecret = webhookSecret.trim()

      const res = await fetch('/api/admin/billing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')

      setNotice('Stripe configuration saved.')
      setPublishableKey('')
      setSecretKey('')
      setWebhookSecret('')

      // Refresh status
      const refresh = await fetch('/api/admin/billing')
      if (refresh.ok) {
        const d = await refresh.json()
        setStripe(d.stripe)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const planInfo = billing ? PLAN_PRICING[billing.plan] ?? PLAN_PRICING.free : null

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-stone-900">Billing & Payments</h1>
          <p className="mt-2 text-sm text-stone-500">
            Plan details, usage, and payment configuration for your community.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-40 animate-pulse rounded-2xl bg-stone-200" />
            <div className="h-32 animate-pulse rounded-2xl bg-stone-200" />
          </div>
        ) : error && !billing ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            {error}
          </div>
        ) : billing && planInfo ? (
          <div className="space-y-6">

            {/* Neighbri plan & pricing */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    Neighbri Plan
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-stone-900">{planInfo.label}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${planInfo.color}`}>
                      {planInfo.price}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-500">{billing.communityName}</p>
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
                  What's Included
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
                    <span className="text-sm font-normal text-stone-400"> / {billing.maxMembers}</span>
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (billing.currentMembers / billing.maxMembers) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-stone-500">Amenities</p>
                  <p className="mt-1 text-2xl font-bold text-stone-900">
                    {billing.currentAmenities}
                    <span className="text-sm font-normal text-stone-400"> / {billing.maxAmenities}</span>
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-stone-100">
                    <div className="h-2 rounded-full bg-purple-500" style={{ width: `${Math.min(100, (billing.currentAmenities / billing.maxAmenities) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Stripe configuration */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                    Payment Processing
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-stone-900">Stripe</h3>
                </div>
                {stripe?.connected ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Connected</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Not configured</span>
                )}
              </div>

              {stripe?.connected ? (
                <div className="space-y-3">
                  <div className="space-y-2 text-sm text-stone-600">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Publishable key configured
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Secret key configured
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Webhook secret configured
                    </div>
                  </div>
                  <div className="rounded-lg bg-stone-50 px-4 py-3">
                    <p className="text-xs text-stone-400 mb-1">Your webhook URL</p>
                    <p className="font-mono text-xs text-stone-700 select-all break-all">https://neighbri.com/api/webhooks/stripe/community/{billing?.communityId}</p>
                  </div>
                  <p className="text-xs text-stone-400">
                    To update your keys, fill in the fields below and save.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-stone-50 border border-stone-200 p-5 mb-4">
                  <p className="text-sm font-semibold text-stone-900 mb-1">Setup required for paid amenities</p>
                  <p className="text-sm text-stone-500 mb-5">
                    To collect payments from residents, connect your community&apos;s own Stripe account.
                    Funds from bookings go directly to your account &mdash; Neighbri never touches them.
                  </p>

                  {/* Part A: Get your API keys */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Part A &mdash; Get your API keys</p>
                    <div className="space-y-3">
                      <div className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">1</span>
                        <p className="text-sm text-stone-700">
                          Go to <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-medium underline">stripe.com</a> and create an account (or sign in to your existing one)
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">2</span>
                        <div className="text-sm text-stone-700">
                          <p>In your Stripe dashboard, go to <strong>Developers &gt; API keys</strong></p>
                          <p className="mt-1 text-xs text-stone-500">Copy both keys:</p>
                          <ul className="mt-1 space-y-0.5 text-xs text-stone-500">
                            <li>&bull; <strong>Publishable key</strong> (starts with <code className="bg-stone-100 px-1 rounded">pk_live_</code>)</li>
                            <li>&bull; <strong>Secret key</strong> (starts with <code className="bg-stone-100 px-1 rounded">sk_live_</code>)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part B: Set up your webhook */}
                  <div className="mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Part B &mdash; Set up your webhook</p>
                    <div className="space-y-3">
                      <div className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">3</span>
                        <div className="text-sm text-stone-700">
                          <p>In Stripe, go to <strong>Developers &gt; Webhooks &gt; Add endpoint</strong></p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">4</span>
                        <div className="text-sm text-stone-700">
                          <p>Set the <strong>Endpoint URL</strong> to this (unique to your community):</p>
                          <p className="mt-1.5 rounded-lg bg-white border border-stone-200 px-3 py-2 font-mono text-xs text-stone-800 select-all break-all">
                            https://neighbri.com/api/webhooks/stripe/community/{billing?.communityId}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">5</span>
                        <div className="text-sm text-stone-700">
                          <p>Under <strong>Select events</strong>, choose these two:</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            <span className="rounded bg-white border border-stone-200 px-2.5 py-1 font-mono text-xs text-stone-700">checkout.session.completed</span>
                            <span className="rounded bg-white border border-stone-200 px-2.5 py-1 font-mono text-xs text-stone-700">checkout.session.expired</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-bold text-stone-600">6</span>
                        <div className="text-sm text-stone-700">
                          <p>Click <strong>Add endpoint</strong>, then click on your new endpoint to reveal the <strong>Signing secret</strong></p>
                          <p className="mt-1 text-xs text-stone-500">It starts with <code className="bg-stone-100 px-1 rounded">whsec_</code></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Part C */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Part C &mdash; Connect to Neighbri</p>
                    <div className="flex gap-3 items-start">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">7</span>
                      <p className="text-sm text-stone-700">Paste all three keys into the fields below and click <strong>Save Stripe configuration</strong></p>
                    </div>
                  </div>
                </div>
              )}

              {notice && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {notice}
                </div>
              )}
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={saveStripeConfig} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Publishable Key
                    {stripe?.hasPublishableKey && <span className="ml-2 text-xs text-emerald-600">(saved)</span>}
                  </label>
                  <input
                    type="text"
                    value={publishableKey}
                    onChange={(e) => setPublishableKey(e.target.value)}
                    placeholder={stripe?.hasPublishableKey ? 'pk_live_••••••••••••' : 'pk_live_...'}
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 font-mono placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Secret Key
                    {stripe?.hasSecretKey && <span className="ml-2 text-xs text-emerald-600">(saved)</span>}
                  </label>
                  <input
                    type="password"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    placeholder={stripe?.hasSecretKey ? 'sk_live_••••••••••••' : 'sk_live_...'}
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 font-mono placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    Webhook Signing Secret
                    {stripe?.hasWebhookSecret && <span className="ml-2 text-xs text-emerald-600">(saved)</span>}
                  </label>
                  <input
                    type="password"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    placeholder={stripe?.hasWebhookSecret ? 'whsec_••••••••••••' : 'whsec_...'}
                    className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-stone-900 font-mono placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving || (!publishableKey.trim() && !secretKey.trim() && !webhookSecret.trim())}
                  className="rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-300"
                >
                  {saving ? 'Saving...' : 'Save Stripe configuration'}
                </button>
              </form>
            </div>

            {/* Support */}
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-400 mb-2">
                Billing Support
              </p>
              <p className="text-sm text-stone-600">
                For plan changes, billing questions, or help with Stripe setup, contact{' '}
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
