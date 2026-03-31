import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export type AppRole = 'resident' | 'property_manager' | 'janitorial' | 'board'

export async function getAuthContext() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__session')?.value

  if (!sessionCookie) {
    return { userId: null, role: undefined }
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    const role = (decoded as Record<string, unknown>).role as string | undefined
    return { userId: decoded.uid, role }
  } catch {
    return { userId: null, role: undefined }
  }
}

export async function requireUser() {
  const { userId, role } = await getAuthContext()
  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 }),
    }
  }
  return { ok: true as const, userId, role }
}

export async function requireRole(allowedRoles: AppRole[]) {
  const authState = await requireUser()
  if (!authState.ok) return authState
  if (!authState.role || !allowedRoles.includes(authState.role as AppRole)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 }),
    }
  }
  return authState
}
