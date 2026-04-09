import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
        <h1 className="mt-4 text-6xl font-bold text-stone-900">404</h1>
        <p className="mt-4 text-lg text-stone-600">
          This page doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Go home
          </Link>
          <Link
            href="/resident"
            className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Book an amenity
          </Link>
        </div>
      </div>
    </main>
  )
}
