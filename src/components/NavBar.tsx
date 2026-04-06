'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { useCommunity } from '@/components/providers/CommunityProvider'

function CommunitySwitcher() {
  const { activeCommunity, communities, switchCommunity, loading } = useCommunity()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (loading || communities.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors"
      >
        <span className="max-w-[140px] truncate">{activeCommunity?.name ?? 'Select community'}</span>
        <svg className={`h-3.5 w-3.5 text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-stone-200 bg-white py-1 shadow-lg">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Your communities
          </div>
          {communities.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                if (c.id !== activeCommunity?.id) switchCommunity(c.id)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-stone-50"
            >
              <span className="flex-1 truncate text-stone-800">{c.name}</span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                {c.role.replaceAll('_', ' ')}
              </span>
              {c.id === activeCommunity?.id && (
                <svg className="h-4 w-4 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
          <div className="border-t border-stone-100 mt-1 pt-1">
            <Link
              href="/communities/join"
              className="block px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50"
              onClick={() => setOpen(false)}
            >
              Join another community
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export function NavBar() {
  const { user, role, loading, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  function closeMobile() {
    setMobileOpen(false)
  }

  return (
    <nav className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700"
          >
            Neighbri
          </Link>

          {user && <CommunitySwitcher />}

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
              {/* Super-admin internal link — gated by property_manager for now; real superAdmin check coming */}
              {role === 'property_manager' && (
                <Link href="/internal" className="text-purple-600 hover:text-purple-800">
                  Internal
                </Link>
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

              {/* Mobile community switcher */}
              <MobileCommunitySwitcher closeMobile={closeMobile} />

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
              {/* Super-admin internal link — gated by property_manager for now */}
              {role === 'property_manager' && (
                <Link
                  href="/internal"
                  className="block rounded-xl px-4 py-2.5 text-sm text-purple-600 hover:bg-purple-50"
                  onClick={closeMobile}
                >
                  Internal
                </Link>
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

function MobileCommunitySwitcher({ closeMobile }: { closeMobile: () => void }) {
  const { activeCommunity, communities, switchCommunity, loading } = useCommunity()

  if (loading || communities.length === 0) return null

  return (
    <div className="rounded-xl border border-stone-200 mb-2 overflow-hidden">
      <div className="px-4 py-2 bg-stone-50 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        Community
      </div>
      {communities.map((c) => (
        <button
          key={c.id}
          onClick={() => {
            if (c.id !== activeCommunity?.id) switchCommunity(c.id)
            closeMobile()
          }}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-stone-50"
        >
          <span className="flex-1 truncate text-stone-800">{c.name}</span>
          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
            {c.role.replaceAll('_', ' ')}
          </span>
          {c.id === activeCommunity?.id && (
            <svg className="h-4 w-4 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      ))}
      <Link
        href="/communities/join"
        className="block px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 border-t border-stone-100"
        onClick={closeMobile}
      >
        Join another community
      </Link>
    </div>
  )
}
