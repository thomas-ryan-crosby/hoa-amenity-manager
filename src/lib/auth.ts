import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export type AppRole = 'resident' | 'property_manager' | 'janitorial' | 'board'

export async function getAuthContext() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__session')?.value
  const activeCommunityId = cookieStore.get('__activeCommunity')?.value

  if (!sessionCookie) {
    return { userId: null, role: undefined, communityMemberStatus: undefined }
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)

    // Default role from Firebase Auth custom claims (fallback)
    let role: string | undefined = (decoded as Record<string, unknown>).role as string | undefined
    let communityMemberStatus: string | undefined

    // If an active community is set, resolve role from communityMembers
    if (activeCommunityId) {
      const { getCommunityMember } = await import('@/lib/firebase/db')
      const member = await getCommunityMember(decoded.uid, activeCommunityId)
      if (member) {
        role = member.role
        communityMemberStatus = member.status
      }
    }

    return { userId: decoded.uid, role, communityMemberStatus }
  } catch {
    return { userId: null, role: undefined, communityMemberStatus: undefined }
  }
}

export async function requireUser() {
  const { userId, role, communityMemberStatus } = await getAuthContext()
  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 }),
    }
  }
  return { ok: true as const, userId, role, communityMemberStatus }
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
  // For community-scoped routes, the member must be approved
  if (authState.communityMemberStatus && authState.communityMemberStatus !== 'approved') {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Your membership is pending approval', code: 'MEMBERSHIP_PENDING' },
        { status: 403 },
      ),
    }
  }
  return authState
}
