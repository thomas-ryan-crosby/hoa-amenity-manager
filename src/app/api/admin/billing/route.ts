import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import { getCommunityById, getCommunityMembers } from '@/lib/firebase/db'
import { adminDb } from '@/lib/firebase/admin'

// ---------------------------------------------------------------------------
// GET — billing info for the active community (admin only)
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  // Extra check: only 'admin' role can see billing
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const [community, members] = await Promise.all([
    getCommunityById(communityId),
    getCommunityMembers(communityId),
  ])

  if (!community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  // Count amenities
  const amenitiesSnap = await adminDb
    .collection('amenities')
    .where('communityId', '==', communityId)
    .get()

  const approvedMembers = members.filter((m) => m.status === 'approved').length

  return NextResponse.json({
    billing: {
      communityName: community.name,
      plan: community.plan,
      maxAmenities: community.maxAmenities,
      maxMembers: community.maxMembers,
      currentAmenities: amenitiesSnap.size,
      currentMembers: approvedMembers,
      contactEmail: community.contactEmail,
    },
  })
}
