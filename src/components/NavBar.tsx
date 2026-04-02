'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'

export function NavBar() {
  const { user, role, loading, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  function closeMobile() {
    setMobileOpen(false)
  }

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700"
          >
            Neighbri
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-4 text-sm text-stone-600">
              <Link href="/resident" className="hover:text-stone-900">
                Book
              </Link>
              <Link href="/resident/bookings" data-tutorial="nav-my-bookings" className="hover:text-stone-900">
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
                  <Link href="/admin/people" className="hover:text-stone-900">
                    People
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-4">
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

        {/* Mobile hamburger button */}
        <button
          className="md:hidden flex flex-col justify-center gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <span className={`block h-0.5 w-5 bg-stone-700 transition-transform ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 bg-stone-700 transition-opacity ${mobileOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-5 bg-stone-700 transition-transform ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 pb-4 pt-2">
          {loading ? (
            <div className="h-4 w-24 animate-pulse rounded bg-stone-200" />
          ) : user ? (
            <div className="space-y-1">
              {/* User info */}
              <div className="rounded-2xl bg-stone-50 px-4 py-3 mb-2">
                <p className="text-sm font-medium text-stone-900">
                  {user.displayName ?? user.email}
                </p>
                {role && (
                  <p className="text-xs text-stone-500">
                    {role.replaceAll('_', ' ')}
                  </p>
                )}
              </div>

              <Link
                href="/resident"
                className="block rounded-xl px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                onClick={closeMobile}
              >
                Book
              </Link>
              <Link
                href="/resident/bookings"
                className="block rounded-xl px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                onClick={closeMobile}
              >
                My Bookings
              </Link>
              {(role === 'property_manager' || role === 'board' || role === 'janitorial') && (
                <Link
                  href="/admin/dashboard"
                  className="block rounded-xl px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                  onClick={closeMobile}
                >
                  Dashboard
                </Link>
              )}
              {(role === 'property_manager' || role === 'board') && (
                <>
                  <Link
                    href="/admin/amenities"
                    className="block rounded-xl px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                    onClick={closeMobile}
                  >
                    Amenities
                  </Link>
                  <Link
                    href="/admin/people"
                    className="block rounded-xl px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                    onClick={closeMobile}
                  >
                    People
                  </Link>
                </>
              )}
              <Link
                href="/account"
                className="block rounded-xl px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
                onClick={closeMobile}
              >
                Account
              </Link>

              <div className="mt-2 pt-2 border-t border-stone-200">
                <button
                  onClick={() => { closeMobile(); signOut() }}
                  className="w-full rounded-full border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <Link
                href="/sign-in"
                className="block w-full rounded-full bg-stone-900 px-4 py-2.5 text-center text-sm font-medium text-white"
                onClick={closeMobile}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="block w-full rounded-full border border-stone-300 px-4 py-2.5 text-center text-sm font-medium text-stone-700"
                onClick={closeMobile}
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}
