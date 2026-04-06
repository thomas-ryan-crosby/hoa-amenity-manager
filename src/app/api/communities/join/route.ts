import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import {
  getInviteByCode,
  incrementInviteUseCount,
  getCommunityMember,
  createCommunityMember,
  getCommunityById,
  getResidentByFirebaseUid,
  createResident,
} from '@/lib/firebase/db'

const JoinSchema = z.object({
  code: z.string().optional(),
  communityId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = JoinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Select a community or enter an invite code' }, { status: 400 })
  }

  let targetCommunityId: string

  if (parsed.data.communityId) {
    // Direct join by community ID (from dropdown)
    const community = await getCommunityById(parsed.data.communityId)
    if (!community || !community.isActive) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }
    targetCommunityId = community.id
  } else if (parsed.data.code) {
    // Join by invite code
    const invite = await getInviteByCode(parsed.data.code.trim())
    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }
    if (!invite.isActive) {
      return NextResponse.json({ error: 'This invite code is no longer active' }, { status: 400 })
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite code has expired' }, { status: 400 })
    }
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return NextResponse.json({ error: 'This invite code has reached its usage limit' }, { status: 400 })
    }
    await incrementInviteUseCount(invite.id)
    targetCommunityId = invite.communityId
  } else {
    return NextResponse.json({ error: 'Select a community or enter an invite code' }, { status: 400 })
  }

  // Check user isn't already a member
  const existingMember = await getCommunityMember(auth.userId, targetCommunityId)
  if (existingMember) {
    return NextResponse.json({ error: 'You are already a member of this community' }, { status: 409 })
  }

  // Get or create resident record
  let resident = await getResidentByFirebaseUid(auth.userId)
  if (!resident) {
    // Create a minimal resident record if it doesn't exist yet
    resident = await createResident({
      firebaseUid: auth.userId,
      name: '',
      email: '',
      phone: null,
      unitNumber: '',
      stripeCustomerId: null,
      status: 'pending',
      createdAt: new Date(),
    })
  }

  // Create communityMember with pending status
  await createCommunityMember({
    communityId: targetCommunityId,
    userId: auth.userId,
    residentId: resident.id,
    role: 'resident',
    status: 'pending',
    unitNumber: resident.unitNumber ?? '',
    joinedAt: new Date(),
    approvedBy: null,
    approvedAt: null,
  })

  // Get community name for response
  const community = await getCommunityById(targetCommunityId)

  return NextResponse.json({
    communityId: targetCommunityId,
    communityName: community?.name ?? 'Unknown',
    status: 'pending',
  })
}
