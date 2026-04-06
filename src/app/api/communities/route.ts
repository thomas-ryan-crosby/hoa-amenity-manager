import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import { getUserCommunities, getCommunityById } from '@/lib/firebase/db'

export async function GET() {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const memberships = await getUserCommunities(auth.userId)

  const communities = await Promise.all(
    memberships.map(async (m) => {
      const community = await getCommunityById(m.communityId)
      return {
        id: m.communityId,
        name: community?.name ?? 'Unknown',
        slug: community?.slug ?? '',
        role: m.role,
        status: m.status,
      }
    })
  )

  const activeCommunityId = await getActiveCommunityId()

  return NextResponse.json({ communities, activeCommunityId })
}
