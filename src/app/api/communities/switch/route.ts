import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getCommunityMember } from '@/lib/firebase/db'

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { communityId } = await req.json()
  if (!communityId || typeof communityId !== 'string') {
    return NextResponse.json({ error: 'communityId is required' }, { status: 400 })
  }

  // Validate the user is a member of this community
  const member = await getCommunityMember(auth.userId, communityId)
  if (!member) {
    return NextResponse.json({ error: 'Not a member of this community' }, { status: 403 })
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set('__activeCommunity', communityId, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  })
  return res
}
