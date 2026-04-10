export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const PLANS = [
  {
    name: 'Essentials',
    price: '$29',
    period: '/mo',
    desc: 'For small communities getting started with amenity booking.',
    features: ['Up to 5 amenities', 'Up to 100 members', 'Booking calendar', 'Email notifications', 'Approval workflows', 'Waitlist management', 'Stripe payments'],
  },
  {
    name: 'Growth',
    price: '$99',
    period: '/mo',
    popular: true,
    desc: 'For communities ready to monetize their amenities.',
    features: ['Up to 20 amenities', 'Up to 1,000 members', 'Outside/guest bookings', 'Revenue reporting', 'Janitorial scheduling', 'Access instructions', 'Booking insights', 'Up to 5 admins'],
  },
  {
    name: 'Enterprise',
    price: '$249',
    period: '/mo',
    desc: 'For large communities and management companies.',
    features: ['Unlimited amenities', 'Unlimited members', 'Everything in Growth', 'Custom branding', 'Priority support', 'Dedicated onboarding', 'API access', 'Unlimited admins'],
  },
]

export default async function Home() {
  const cookieStore = await cookies()
  const session = cookieStore.get('__session')?.value
  if (session) {
    redirect('/resident')
  }
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">30-day free trial on all plans</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-stone-900">
            Turn your community amenities into a <span className="text-emerald-600">revenue stream</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-500">
            Neighbri is the amenity booking platform that helps HOAs manage reservations, collect payments,
            and open amenities to outside guests — like ResortPass, but for your community.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/onboard"
              className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              Start free trial
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-stone-300 px-8 py-3.5 text-sm font-semibold text-stone-700 hover:bg-white transition"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-xs text-stone-400">No credit card required. Setup takes under 5 minutes.</p>
        </div>
      </section>

      {/* Social proof / stats */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-10">
        <div className="mx-auto max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-stone-900">5 min</p>
            <p className="mt-1 text-sm text-stone-500">Setup time</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-stone-900">24/7</p>
            <p className="mt-1 text-sm text-stone-500">Online booking</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-stone-900">$0</p>
            <p className="mt-1 text-sm text-stone-500">Setup fees</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-stone-900">30 days</p>
            <p className="mt-1 text-sm text-stone-500">Free trial</p>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">The problem</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900">
                Your amenities are underutilized and unmonetized
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  'Residents book by calling the office or emailing spreadsheets',
                  'No way for outside guests to discover or book your spaces',
                  'Cleaning schedules are managed on paper or whiteboard',
                  'Payment collection is manual and inconsistent',
                  'No visibility into which amenities are popular or profitable',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-600">✕</span>
                    <p className="text-sm text-stone-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">The solution</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900">
                Neighbri automates everything
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  'Self-service booking calendar residents actually enjoy using',
                  'Open amenities to outside guests and collect booking fees',
                  'Automated cleaning windows with janitorial staff assignment',
                  'Stripe payments, deposits, and refunds — fully automated',
                  'Real-time insights into bookings, revenue, and utilization',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">✓</span>
                    <p className="text-sm text-stone-600">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Platform features
          </p>
          <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-stone-900">
            Everything you need to manage and monetize amenities
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Live booking calendar', desc: 'Real-time availability with drag-to-book. Residents see what\'s open and reserve in seconds.' },
              { title: 'Smart approvals', desc: 'Auto-approve small events. Route larger ones to admins with one-click approve or deny via email.' },
              { title: 'Stripe payments', desc: 'Collect rental fees and security deposits automatically. Refunds processed per your cancellation policy.' },
              { title: 'Outside guest bookings', desc: 'Open your pool, clubhouse, or courts to non-residents. Generate revenue from underused amenities.' },
              { title: 'Waitlist management', desc: 'Popular slot taken? Residents join the waitlist automatically and get promoted when a spot opens.' },
              { title: 'Cleaning automation', desc: 'Turn windows created automatically after each booking. Janitorial staff see their schedule and confirm completion.' },
              { title: 'Revenue insights', desc: 'See which amenities generate the most revenue, busiest days, peak hours, and booking trends.' },
              { title: 'Multi-community', desc: 'Management companies can run multiple communities from one platform. Each with its own settings and branding.' },
              { title: 'Email notifications', desc: 'Booking received, approved, confirmed, reminders, access instructions — everyone stays informed.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <h3 className="font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Get started in minutes
          </p>
          <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-stone-900">
            How it works
          </h2>

          <div className="mt-14 grid gap-8 sm:grid-cols-4">
            {[
              { step: '1', title: 'Create your community', desc: 'Enter your community name and address. Takes under 2 minutes.' },
              { step: '2', title: 'Add amenities', desc: 'Configure your clubhouse, pool, courts — set pricing, rules, and availability.' },
              { step: '3', title: 'Invite residents', desc: 'Residents sign up and join your community. You approve their access.' },
              { step: '4', title: 'Start earning', desc: 'Residents book amenities. Open to outside guests for additional revenue.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-stone-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Built for every role
          </p>
          <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-stone-900">
            One platform, purpose-built views
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {[
              { role: 'Residents', icon: '🏠', desc: 'Browse the calendar, book amenities, join the waitlist, and manage your reservations — all from your phone or computer.' },
              { role: 'Community Admins', icon: '⚙️', desc: 'Approve bookings, configure amenities and pricing, manage members, and view revenue insights from a powerful dashboard.' },
              { role: 'Janitorial Staff', icon: '🧹', desc: 'See assigned cleaning jobs, adjust turn windows with drag-and-drop, and complete post-event inspections.' },
              { role: 'Board Members', icon: '📊', desc: 'View booking activity, utilization trends, and revenue reports. Full visibility into how amenities are being used.' },
            ].map((r) => (
              <div key={r.role} className="rounded-2xl border border-stone-200 p-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{r.icon}</span>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">{r.role}</p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-stone-200 px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Pricing
          </p>
          <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-stone-900">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-center text-sm text-stone-500 max-w-xl mx-auto">
            All plans include a 30-day free trial. No credit card required. Cancel anytime.
          </p>

          <div className="mt-14 grid gap-6 sm:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border-2 p-6 ${
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
                <p className="mt-2 text-xs text-stone-500">{p.desc}</p>
                <ul className="mt-5 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-stone-600">
                      <svg className="h-4 w-4 flex-shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/onboard"
                  className={`mt-6 block w-full rounded-full py-2.5 text-center text-sm font-semibold transition ${
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
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl sm:text-3xl font-bold text-stone-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-6">
            {[
              { q: 'What is Neighbri?', a: 'Neighbri is an amenity booking platform built specifically for HOA communities. It lets residents book clubhouses, pools, courts, and common areas online — and lets communities generate revenue by opening amenities to outside guests.' },
              { q: 'How is this different from other HOA software?', a: 'Most HOA software tries to do everything (accounting, violations, ARC requests). Neighbri focuses exclusively on amenity booking and does it exceptionally well — at a fraction of the price.' },
              { q: 'What does "outside guest bookings" mean?', a: 'Like ResortPass for hotels, your community can allow non-residents to book amenities (pool day passes, event spaces, court time) for a fee. It\'s a new revenue stream for your HOA.' },
              { q: 'How does the 30-day free trial work?', a: 'Sign up, set up your community, and use all features for 30 days at no cost. No credit card required to start. If you love it, pick a plan. If not, no hard feelings.' },
              { q: 'Can I change plans later?', a: 'Yes, upgrade or downgrade anytime. Changes take effect on your next billing cycle.' },
              { q: 'Is payment processing included?', a: 'Yes, all plans include Stripe payment processing. You connect your own Stripe account so funds go directly to your HOA. Standard Stripe fees (2.9% + $0.30) apply.' },
              { q: 'Who built Neighbri?', a: 'Neighbri is developed by CrumbLabz LLC, a software company focused on building tools for community management.' },
            ].map((faq) => (
              <div key={faq.q} className="border-b border-stone-100 pb-6">
                <h3 className="font-semibold text-stone-900">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Ready to monetize your amenities?
          </h2>
          <p className="mt-4 text-stone-500">
            Join communities already using Neighbri to manage bookings and generate revenue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/onboard"
              className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition"
            >
              Start your 30-day free trial
            </Link>
            <Link
              href="/join"
              className="rounded-full border border-stone-300 px-8 py-3.5 text-sm font-semibold text-stone-700 hover:bg-white transition"
            >
              Join your community
            </Link>
          </div>
          <p className="mt-4 text-xs text-stone-400">No credit card required. Cancel anytime.</p>
        </div>
      </section>
    </main>
  )
}
