import Link from 'next/link'

const FEATURES = [
  {
    category: 'Booking & Scheduling',
    items: [
      {
        title: 'Live booking calendar',
        desc: 'A real-time calendar showing every amenity\'s availability. Residents drag to select a time slot and submit a booking request in seconds. Works on desktop and mobile.',
      },
      {
        title: 'Click or drag to book',
        desc: 'Click a time slot for a precise booking picker, or drag across the calendar to select a custom range. The experience is intuitive — no training required.',
      },
      {
        title: 'Waitlist management',
        desc: 'When a slot is taken, residents can join the waitlist with one click. If the original booking is cancelled, the next person in line is automatically promoted and notified.',
      },
      {
        title: 'Suggested amenity pairings',
        desc: 'When booking the clubhouse, prompt residents to also book the patio or grills. Increases utilization and makes events easier to plan.',
      },
    ],
  },
  {
    category: 'Payments & Revenue',
    items: [
      {
        title: 'Stripe payment processing',
        desc: 'Collect rental fees and security deposits automatically via Stripe. Funds go directly to your HOA\'s Stripe account. Supports credit cards and ACH.',
      },
      {
        title: 'Outside guest bookings',
        desc: 'Open your pool, clubhouse, or courts to non-residents for a fee — like ResortPass, but for your community. A new revenue stream that pays for Neighbri many times over.',
      },
      {
        title: 'Flexible pricing & refunds',
        desc: 'Set per-amenity rental fees, security deposits, and cancellation policies. Full refund windows, partial refund windows, and no-refund periods — all configurable.',
      },
      {
        title: 'Revenue reporting',
        desc: 'See which amenities generate the most revenue, track booking trends over time, and identify peak demand periods. Data to make smarter pricing decisions.',
      },
    ],
  },
  {
    category: 'Administration',
    items: [
      {
        title: 'Smart approval workflows',
        desc: 'Configure per-amenity: auto-approve small events, require approval above a guest threshold, or always require approval. One-click approve or deny via email.',
      },
      {
        title: 'Amenity configuration',
        desc: 'Set capacity, pricing, rules, access instructions, linked amenities, blackout dates, and cleaning requirements for each amenity. Summary view with on-demand editing.',
      },
      {
        title: 'Member management',
        desc: 'Approve or deny membership requests. Assign roles (admin, property manager, board, janitorial, resident). View all members with role and status at a glance.',
      },
      {
        title: 'Booking insights',
        desc: 'Most popular amenities, busiest days, peak hours, 6-month booking trends, most active residents, average booking duration — all in one dashboard.',
      },
    ],
  },
  {
    category: 'Operations',
    items: [
      {
        title: 'Cleaning automation',
        desc: 'Turn windows are created automatically after each booking based on the amenity\'s configured turn time. Residents see cleaning blocks in real time as they book.',
      },
      {
        title: 'Janitorial scheduling',
        desc: 'Staff see their assigned cleaning jobs, drag-and-drop to adjust windows, confirm completion, and submit post-event inspection reports.',
      },
      {
        title: 'Access instructions',
        desc: 'Gate codes, keys, and entry instructions are sent to residents automatically 1 hour before their booking starts. Configurable per amenity.',
      },
      {
        title: '48-hour reminders',
        desc: 'Automated email reminders go out 48 hours before each booking. Residents are reminded of community rules and event details. Janitorial staff get their job assignment.',
      },
    ],
  },
  {
    category: 'Platform',
    items: [
      {
        title: 'Multi-community support',
        desc: 'Management companies can run multiple communities from one account. Each community has its own amenities, members, settings, and billing. Residents can belong to multiple communities.',
      },
      {
        title: 'Role-based access',
        desc: 'Five roles — admin, property manager, board, janitorial, and resident — each with purpose-built views. Admins see everything, residents see what they need.',
      },
      {
        title: 'Email notifications',
        desc: 'Branded Neighbri emails at every step: booking received, approved, confirmed, payment required, 48-hour reminder, access instructions, post-event follow-up, and cancellation.',
      },
      {
        title: 'Self-service onboarding',
        desc: 'Communities can sign up and start booking in under 5 minutes. No sales calls, no implementation fees, no waiting. Choose a plan, add your amenities, invite residents.',
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-20 pb-8 sm:pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Features</p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold text-stone-900">
            Everything you need to manage and monetize amenities
          </h1>
          <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
            From booking calendars to revenue reporting, Neighbri handles the full amenity lifecycle.
          </p>
        </div>
      </section>

      {/* Feature sections */}
      {FEATURES.map((section, i) => (
        <section
          key={section.category}
          className={`border-t border-stone-200 px-4 sm:px-6 py-16 sm:py-20 ${i % 2 === 0 ? 'bg-white' : ''}`}
        >
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">
              {section.category}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {section.items.map((f) => (
                <div key={f.title} className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
                  <h3 className="font-semibold text-stone-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

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
              { role: 'Residents', icon: '🏠', desc: 'Browse the calendar, book amenities, join the waitlist, and manage reservations — all from any device.' },
              { role: 'Community Admins', icon: '⚙️', desc: 'Approve bookings, configure amenities and pricing, manage members, view revenue insights, and handle billing.' },
              { role: 'Janitorial Staff', icon: '🧹', desc: 'See assigned cleaning jobs, adjust turn windows with drag-and-drop, and complete post-event inspections.' },
              { role: 'Board Members', icon: '📊', desc: 'View booking activity, utilization trends, and revenue reports. Full visibility into how amenities are performing.' },
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

      {/* CTA */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-14 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-stone-900">Ready to see it in action?</h2>
          <p className="mt-3 text-stone-500">Start your 30-day free trial. Setup takes under 5 minutes.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/onboard"
              className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
            >
              Start free trial
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-stone-300 px-8 py-3.5 text-sm font-semibold text-stone-700 hover:bg-white transition"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
