import { AdminCalendar } from '@/components/calendar/AdminCalendar'

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
              Property Manager
            </p>
            <h1 className="mt-2 text-4xl font-semibold text-stone-900">
              Dashboard
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Review pending approvals, scan confirmed reservations across all
              amenities, and use settings to manage policies and blackout dates.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
              href="/admin/approvals"
            >
              Pending approvals
            </a>
            <a
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
              href="/admin/settings"
            >
              Settings
            </a>
          </div>
        </div>

        <AdminCalendar />
      </div>
    </main>
  )
}
