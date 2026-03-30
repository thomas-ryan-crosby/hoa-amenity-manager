import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhooks/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)'])

const isJanitorialRoute = createRouteMatcher(['/janitorial(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return
  }

  const { sessionClaims } = await auth.protect()
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role

  if (isAdminRoute(req) && role !== 'property_manager' && role !== 'board') {
    return new Response('Forbidden', { status: 403 })
  }

  if (
    isJanitorialRoute(req) &&
    role !== 'janitorial' &&
    role !== 'property_manager'
  ) {
    return new Response('Forbidden', { status: 403 })
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
