export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f3ff,_#f7fee7_45%,_#fafaf9_100%)] px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-xl shadow-stone-200/60 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Sanctuary Booking
            </p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight text-stone-900">
              HOA amenity reservations, approvals, payments, and follow-up in one workflow.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">
              Residents can request bookings, managers can review approvals, and
              janitorial staff can close the loop with inspections after each event.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
                href="/resident"
              >
                Resident portal
              </a>
              <a
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
                href="/admin/dashboard"
              >
                Manager dashboard
              </a>
              <a
                className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700"
                href="/janitorial"
              >
                Janitorial view
              </a>
            </div>
          </section>

          <section className="grid gap-4">
            {[
              'Resident self-service booking requests',
              'Amenity-specific approval and cancellation rules',
              'Stripe payment and deposit collection',
              'Inspection workflow for janitorial follow-up',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-medium text-stone-500">Current capability</p>
                <p className="mt-2 text-xl font-semibold text-stone-900">{item}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  )
}
