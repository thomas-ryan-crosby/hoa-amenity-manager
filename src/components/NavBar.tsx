'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

export function NavBar() {
  const { user, role, loading, signOut } = useAuth()

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700"
          >
            Neighbri
          </Link>

          {user && (
            <div className="flex items-center gap-4 text-sm text-stone-600">
              <Link href="/resident" className="hover:text-stone-900">
                Book
              </Link>
              <Link href="/resident/bookings" className="hover:text-stone-900">
                My Bookings
              </Link>
              {(role === 'property_manager' || role === 'board' || role === 'janitorial') && (
                <Link href="/admin/dashboard" className="hover:text-stone-900">
                  Dashboard
                </Link>
              )}
              {(role === 'property_manager' || role === 'board') && (
                <>
                  <Link href="/admin/amenities" className="hover:text-stone-900">
                    Amenities
                  </Link>
                  <Link href="/admin/residents" className="hover:text-stone-900">
                    Residents
                  </Link>
                  <Link href="/admin/settings" className="hover:text-stone-900">
                    Settings
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
          ) : user ? (
            <>
              <Link href="/account" className="text-right hover:opacity-80">
                <p className="text-sm font-medium text-stone-900">
                  {user.displayName ?? user.email}
                </p>
                {role && (
                  <p className="text-xs text-stone-500">
                    {role.replaceAll('_', ' ')}
                  </p>
                )}
              </Link>
              <button
                onClick={signOut}
                className="rounded-full border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
