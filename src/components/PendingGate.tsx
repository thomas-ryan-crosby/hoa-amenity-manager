'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useCommunity } from '@/components/providers/CommunityProvider'

/** Paths that bypass the pending approval gate */
const BYPASS_PATHS = [
  '/',
  '/sign-in',
  '/sign-up',
  '/join',
  '/onboard',
  '/features',
  '/pricing',
  '/account',
  '/internal',
  '/technology',
  '/terms',
  '/privacy',
]

function shouldBypass(pathname: string): boolean {
  return BYPASS_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export function PendingGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { activeCommunity, loading: communityLoading } = useCommunity()
  const pathname = usePathname()

  // Bypass paths always show content
  if (shouldBypass(pathname)) {
    return <>{children}</>
  }

  // While auth or community is loading, show a blank screen (prevents flash)
  if (authLoading || communityLoading) {
    return <main className="min-h-screen bg-stone-50" />
  }

  // Not logged in — show content (middleware handles redirect to sign-in)
  if (!user) {
    return <>{children}</>
  }

  // If user has no community, send them to join
  if (!activeCommunity) {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-4 text-2xl font-bold text-stone-900">Join a community</h1>
          <p className="mt-4 text-sm text-stone-600 leading-relaxed">
            You need to join a community before you can start booking amenities.
          </p>
          <a
            href="/join"
            className="mt-6 inline-block rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Find your community
          </a>
        </div>
      </main>
    )
  }

  // If user has a community and it's not approved
  if (activeCommunity.status !== 'approved') {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>
          <h1 className="mt-4 text-2xl font-bold text-stone-900">Account pending approval</h1>
          <p className="mt-4 text-sm text-stone-600 leading-relaxed">
            Your request to join <strong>{activeCommunity.name}</strong> is being reviewed by a
            community administrator. You'll receive an email once you've been approved.
          </p>
          <div className="mt-8 rounded-2xl bg-stone-100 p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wide font-medium mb-1">Status</p>
            <p className="text-sm font-semibold text-amber-600 capitalize">{activeCommunity.status}</p>
          </div>
          <p className="mt-6 text-xs text-stone-400">
            Questions? Contact your property management office or email{' '}
            <a href="mailto:support@neighbri.com" className="text-emerald-600">support@neighbri.com</a>
          </p>
        </div>
      </main>
    )
  }

  return <>{children}</>
}
