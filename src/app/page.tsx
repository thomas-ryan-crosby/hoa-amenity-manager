export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
            The best amenity management software for <span className="text-emerald-600">your community</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-500">
            An intuitive booking calendar, built-in janitorial and maintenance scheduling,
            and tools to better manage and monetize your HOA&apos;s shared spaces — all in one platform.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
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
          <p className="mt-2 text-xs text-stone-400">Residents join for free. Pricing is for communities managing their amenities.</p>
        </div>
      </section>

      {/* Stats */}
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
            <p className="text-3xl font-bold text-stone-900">Free</p>
            <p className="mt-1 text-sm text-stone-500">For residents</p>
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
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-500">The problem</p>
              <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900">
                Managing amenities shouldn&apos;t be this hard
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  'Residents book by calling the office or emailing spreadsheets',
                  'No visibility into availability — double bookings happen',
                  'Cleaning schedules are managed on paper or whiteboard',
                  'Payment collection is manual and inconsistent',
                  'No data on which amenities are popular or underused',
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
                  'Intuitive booking calendar residents actually enjoy using',
                  'Built-in janitorial scheduling and post-event inspections',
                  'Automated cleaning windows so spaces are always ready',
                  'Stripe payments, deposits, and refunds — fully automated',
                  'Real-time insights into bookings, utilization, and trends',
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

      {/* Feature highlights */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Platform highlights
          </p>
          <h2 className="mt-3 text-center text-2xl sm:text-3xl font-bold text-stone-900">
            Everything your community needs in one platform
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Live booking calendar', desc: 'Real-time availability with drag-to-book. Residents see what\'s open and reserve in seconds.' },
              { title: 'Guest bookings', desc: 'Optionally open amenities to outside guests — perfect for event spaces, pools, and courts.' },
              { title: 'Stripe payments', desc: 'Collect rental fees and security deposits automatically. Funds go directly to your HOA.' },
              { title: 'Cleaning automation', desc: 'Turn windows appear automatically after bookings. Staff see their schedule and confirm completion.' },
              { title: 'Usage insights', desc: 'See which amenities are most popular, busiest days, peak hours, and booking trends.' },
              { title: 'Multi-community', desc: 'Management companies can run multiple communities from one platform with isolated settings.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <h3 className="font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/features"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              See all features &rarr;
            </Link>
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
              { step: '4', title: 'You\'re live', desc: 'Residents start booking. Cleaning schedules run automatically. You have full visibility.' },
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

      {/* Pricing teaser */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">Pricing</p>
          <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-stone-900">
            Plans starting at $29/mo
          </h2>
          <p className="mt-3 text-stone-500 max-w-lg mx-auto">
            All plans include a 30-day free trial. No credit card required. From small communities to large management companies.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-center">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-8 py-5">
              <p className="text-2xl font-bold text-stone-900">$29<span className="text-sm font-normal text-stone-500">/mo</span></p>
              <p className="mt-1 text-sm font-medium text-stone-600">Essentials</p>
            </div>
            <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-8 py-5">
              <p className="text-2xl font-bold text-stone-900">$99<span className="text-sm font-normal text-stone-500">/mo</span></p>
              <p className="mt-1 text-sm font-medium text-emerald-700">Growth</p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-8 py-5">
              <p className="text-2xl font-bold text-stone-900">$249<span className="text-sm font-normal text-stone-500">/mo</span></p>
              <p className="mt-1 text-sm font-medium text-stone-600">Enterprise</p>
            </div>
          </div>
          <div className="mt-6">
            <Link
              href="/pricing"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Compare plans &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Ready to simplify amenity management?
          </h2>
          <p className="mt-4 text-stone-500">
            Join communities already using Neighbri to manage bookings, scheduling, and payments.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
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
