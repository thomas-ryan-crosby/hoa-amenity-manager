import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getCommunityMembers, getResidentById } from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

export async function GET() {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ residents: [] })
  }

  const members = await getCommunityMembers(communityId)

  // Resolve resident details for each community member
  const residentsWithRoles = await Promise.all(
    members.map(async (m) => {
      const resident = await getResidentById(m.residentId)
      return {
        // Use communityMember ID so the PUT endpoint can find it
        id: m.id,
        residentId: m.residentId,
        name: resident?.name ?? '',
        email: resident?.email ?? '',
        phone: resident?.phone ?? null,
        unitNumber: m.unitNumber || resident?.unitNumber || '',
        status: m.status,
        role: m.role,
        createdAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : m.joinedAt,
      }
    }),
  )

  return NextResponse.json({ residents: residentsWithRoles })
}
