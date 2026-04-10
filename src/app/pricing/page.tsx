import Link from 'next/link'

const PLANS = [
  {
    name: 'Essentials',
    price: '$29',
    period: '/mo',
    annual: '$24/mo billed annually',
    desc: 'For small communities getting started with amenity booking.',
    features: [
      { name: 'Up to 5 amenities', included: true },
      { name: 'Up to 100 members', included: true },
      { name: 'Booking calendar', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Approval workflows', included: true },
      { name: 'Waitlist management', included: true },
      { name: 'Stripe payments', included: true },
      { name: '1 admin', included: true },
      { name: 'Janitorial scheduling', included: false },
      { name: 'Outside/guest bookings', included: false },
      { name: 'Revenue reporting', included: false },
      { name: 'Booking insights', included: false },
      { name: 'Custom branding', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Growth',
    price: '$99',
    period: '/mo',
    annual: '$83/mo billed annually',
    popular: true,
    desc: 'For communities ready to monetize their amenities and streamline operations.',
    features: [
      { name: 'Up to 20 amenities', included: true },
      { name: 'Up to 1,000 members', included: true },
      { name: 'Booking calendar', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Approval workflows', included: true },
      { name: 'Waitlist management', included: true },
      { name: 'Stripe payments', included: true },
      { name: 'Up to 5 admins', included: true },
      { name: 'Janitorial scheduling', included: true },
      { name: 'Outside/guest bookings', included: true },
      { name: 'Revenue reporting', included: true },
      { name: 'Booking insights', included: true },
      { name: 'Custom branding', included: false },
      { name: 'Priority support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    price: '$249',
    period: '/mo',
    annual: '$208/mo billed annually',
    desc: 'For large communities and management companies that need everything.',
    features: [
      { name: 'Unlimited amenities', included: true },
      { name: 'Unlimited members', included: true },
      { name: 'Booking calendar', included: true },
      { name: 'Email notifications', included: true },
      { name: 'Approval workflows', included: true },
      { name: 'Waitlist management', included: true },
      { name: 'Stripe payments', included: true },
      { name: 'Unlimited admins', included: true },
      { name: 'Janitorial scheduling', included: true },
      { name: 'Outside/guest bookings', included: true },
      { name: 'Revenue reporting', included: true },
      { name: 'Booking insights', included: true },
      { name: 'Custom branding', included: true },
      { name: 'Priority support', included: true },
    ],
  },
]

const FAQS = [
  { q: 'How does the 30-day free trial work?', a: 'Sign up, set up your community, and use all features for 30 days at no cost. No credit card required to start. If you love it, pick a plan. If not, no hard feelings.' },
  { q: 'Can I change plans later?', a: 'Yes, upgrade or downgrade anytime. Changes take effect on your next billing cycle. You\'ll be prorated for any mid-cycle changes.' },
  { q: 'Is payment processing included?', a: 'Yes, all plans include Stripe payment processing. Connect your own Stripe account so funds go directly to your HOA. Standard Stripe fees (2.9% + $0.30) apply per transaction.' },
  { q: 'What does "outside/guest bookings" mean?', a: 'Like ResortPass for hotels, your community can allow non-residents to book amenities (pool day passes, event spaces, court time) for a fee. It\'s a new revenue stream for your HOA — available on Growth and Enterprise plans.' },
  { q: 'Are there any setup fees?', a: 'No. Zero setup fees on all plans. Enterprise customers get dedicated onboarding included at no extra cost.' },
  { q: 'What happens when I hit my amenity or member limit?', a: 'We\'ll let you know when you\'re approaching your limit. You can upgrade to the next tier anytime to unlock more capacity.' },
  { q: 'Can management companies use Neighbri for multiple communities?', a: 'Yes. Neighbri supports multi-community management from a single account. Each community has its own settings, members, and billing. Enterprise plans are ideal for this.' },
  { q: 'How do I cancel?', a: 'Cancel anytime from your billing page. No cancellation fees, no long-term contracts. Your data remains accessible until the end of your billing period.' },
]

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-20 pb-8 sm:pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Pricing</p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold text-stone-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
            All plans include a 30-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="mx-auto max-w-5xl grid gap-6 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border-2 p-6 flex flex-col ${
                p.popular ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-white'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <p className="text-lg font-bold text-stone-900">{p.name}</p>
              <p className="mt-2">
                <span className="text-3xl font-bold text-stone-900">{p.price}</span>
                <span className="text-sm text-stone-500">{p.period}</span>
              </p>
              <p className="mt-1 text-xs text-stone-400">{p.annual}</p>
              <p className="mt-3 text-sm text-stone-500">{p.desc}</p>

              <ul className="mt-6 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f.name} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="h-4 w-4 flex-shrink-0 text-center text-stone-300">—</span>
                    )}
                    <span className={f.included ? 'text-stone-700' : 'text-stone-400'}>{f.name}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/onboard"
                className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-semibold transition ${
                  p.popular
                    ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                    : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
                }`}
              >
                Start free trial
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-stone-400">
          All prices in USD. Annual billing saves ~17%.
        </p>
      </section>

      {/* FAQ */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-stone-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border-b border-stone-100 pb-6">
                <h3 className="font-semibold text-stone-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-stone-900">Ready to get started?</h2>
          <p className="mt-3 text-stone-500">Start your 30-day free trial. No credit card required.</p>
          <Link
            href="/onboard"
            className="mt-6 inline-block rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
          >
            Start free trial
          </Link>
        </div>
      </section>
    </main>
  )
}
