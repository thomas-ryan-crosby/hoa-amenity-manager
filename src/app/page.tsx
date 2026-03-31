import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="px-6 pt-20 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Neighbri
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight text-stone-900 sm:text-6xl">
            Community amenity booking, simplified.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-stone-500">
            Reserve clubhouses, pools, courts, and common areas in your community.
            Manage approvals, payments, and cleaning schedules — all in one place.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Get started free
            </Link>
            <Link
              href="/sign-in"
              className="rounded-full border border-stone-300 px-7 py-3.5 text-sm font-semibold text-stone-700 hover:bg-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            How it works
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold text-stone-900">
            Three steps to your next reservation
          </h2>

          <div className="mt-14 grid gap-10 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Browse & book',
                desc: 'See real-time availability on the calendar. Pick a slot, enter your guest count, and submit a request.',
              },
              {
                step: '2',
                title: 'Get approved',
                desc: 'Your property manager reviews the request. Some amenities auto-approve instantly.',
              },
              {
                step: '3',
                title: 'Show up & enjoy',
                desc: 'Receive a confirmation email. The space is cleaned and ready when you arrive.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-600">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-stone-200 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            Built for communities
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold text-stone-900">
            Everything your HOA needs
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Live calendar', desc: 'See what\'s booked, what\'s available, and what\'s pending — updated in real time.' },
              { title: 'Smart approvals', desc: 'Auto-approve small events. Route larger ones to the property manager with one-click approve or deny.' },
              { title: 'Waitlist queue', desc: 'Popular slot? Get in line automatically. You\'re promoted the moment someone cancels.' },
              { title: 'Cleaning windows', desc: 'Janitorial turn time is blocked automatically. Staff drag-and-drop to set their cleaning schedule.' },
              { title: 'Flexible pricing', desc: 'Free or paid amenities. Set rental fees, deposits, and cancellation policies per amenity.' },
              { title: 'Email notifications', desc: 'Booking received, approved, confirmed, cancelled — residents and staff stay informed at every step.' },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-white p-6"
              >
                <h3 className="font-semibold text-stone-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-stone-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-sm font-semibold uppercase tracking-[0.24em] text-stone-400">
            For every role
          </p>
          <h2 className="mt-3 text-center text-3xl font-semibold text-stone-900">
            One platform, four views
          </h2>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {[
              { role: 'Residents', desc: 'Browse availability, submit booking requests, track status, and receive email updates.' },
              { role: 'Property Managers', desc: 'Approve or deny requests, manage amenity settings, cancel bookings, and adjust cleaning windows.' },
              { role: 'Janitorial Staff', desc: 'See assigned jobs, drag-and-drop cleaning windows, and mark inspections complete.' },
              { role: 'HOA Board', desc: 'Read-only overview of all bookings and utilization across the community.' },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  {r.role}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-200 px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold text-stone-900">
            Ready to get started?
          </h2>
          <p className="mt-4 text-stone-500">
            Create a free account and start managing your community's amenities today.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500"
            >
              Create account
            </Link>
            <Link
              href="/technology"
              className="rounded-full border border-stone-300 px-7 py-3.5 text-sm font-semibold text-stone-700 hover:bg-white"
            >
              See how it works
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-sm text-stone-400">
          <p>Neighbri</p>
          <div className="flex gap-6">
            <Link href="/technology" className="hover:text-stone-600">Technology</Link>
            <Link href="/sign-in" className="hover:text-stone-600">Sign in</Link>
            <Link href="/sign-up" className="hover:text-stone-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
