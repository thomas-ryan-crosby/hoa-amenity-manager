export default function ApprovalsPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-700">
          Pending approvals
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">
          Review booking requests from the dashboard
        </h1>
        <p className="mt-4 text-base leading-7 text-stone-600">
          The dashboard calendar now surfaces pending requests directly with
          approve and deny actions. Use it as the primary approval workspace.
        </p>
        <a
          className="mt-6 inline-flex rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
          href="/admin/dashboard"
        >
          Open dashboard
        </a>
      </div>
    </main>
  )
}
