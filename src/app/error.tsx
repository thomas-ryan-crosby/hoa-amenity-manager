'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
        <h1 className="mt-4 text-3xl font-bold text-stone-900">Something went wrong</h1>
        <p className="mt-4 text-sm text-stone-600 leading-relaxed">
          An unexpected error occurred. Please try again, or contact support if the problem persists.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Go home
          </a>
        </div>
        <p className="mt-8 text-xs text-stone-400">
          If this keeps happening, email <a href="mailto:support@neighbri.com" className="text-emerald-600">support@neighbri.com</a>
        </p>
      </div>
    </main>
  )
}
