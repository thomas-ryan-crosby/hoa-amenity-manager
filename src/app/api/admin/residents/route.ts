import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getAllResidents } from '@/lib/firebase/db'
import { adminAuth } from '@/lib/firebase/admin'
import { getActiveCommunityId } from '@/lib/community'

export async function GET() {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const communityId = await getActiveCommunityId()
  const residents = await getAllResidents(communityId ?? undefined)

  // Fetch Firebase Auth roles for each resident
  const residentsWithRoles = await Promise.all(
    residents.map(async (r) => {
      let role = 'resident'
      if (r.firebaseUid) {
        try {
          const user = await adminAuth.getUser(r.firebaseUid)
          role = (user.customClaims?.role as string) ?? 'resident'
        } catch {
          // User may have been deleted from Auth
        }
      }
      return {
        ...r,
        role,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      }
    }),
  )

  residentsWithRoles.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (b.status === 'pending' && a.status !== 'pending') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return NextResponse.json({ residents: residentsWithRoles })
}
