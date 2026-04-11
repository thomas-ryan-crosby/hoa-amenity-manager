import { NextRequest, NextResponse } from 'next/server'

const publicPaths = ['/', '/sign-in', '/sign-up', '/technology', '/join', '/onboard', '/features', '/pricing', '/how-it-works', '/test-plan', '/terms', '/privacy', '/get-started', '/browse']

function isPublic(pathname: string) {
  // Strip trailing slash for matching (except root)
  const normalized = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  if (publicPaths.includes(normalized)) return true
  if (publicPaths.some((p) => p !== '/' && normalized.startsWith(p + '/'))) return true
  if (normalized.startsWith('/join')) return true
  if (pathname.startsWith('/api/webhooks/')) return true
  if (pathname.startsWith('/api/auth/')) return true
  if (pathname.startsWith('/api/cron')) return true
  if (pathname === '/api/amenities') return true
  if (pathname.startsWith('/api/lookup/')) return true
  if (pathname === '/api/calendar/events') return true
  if (pathname.startsWith('/api/communities')) return true
  if (pathname.startsWith('/api/book/')) return true
  if (pathname.startsWith('/api/browse')) return true
  return false
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const session = req.cookies.get('__session')?.value
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
