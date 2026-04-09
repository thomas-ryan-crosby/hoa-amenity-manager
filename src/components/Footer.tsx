import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-400">
          <p>&copy; {new Date().getFullYear()} CrumbLabz LLC. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-stone-600">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-stone-600">Privacy Policy</Link>
            <a href="mailto:support@neighbri.com" className="hover:text-stone-600">Support</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
