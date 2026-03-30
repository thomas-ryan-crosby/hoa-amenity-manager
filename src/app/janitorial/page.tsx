import { JanitorialCalendar } from '@/components/calendar/JanitorialCalendar'

export default function JanitorialPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-700">
            Janitorial
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-stone-900">
            Job schedule
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
            Review upcoming setup work and complete post-event inspections from a
            mobile-friendly checklist.
          </p>
        </div>
        <JanitorialCalendar />
      </div>
    </main>
  )
}
