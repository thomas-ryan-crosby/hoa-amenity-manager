import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import {
  getCommunityInvites,
  createCommunityInvite,
} from '@/lib/firebase/db'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function GET() {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const invites = await getCommunityInvites(communityId)

  return NextResponse.json({
    invites: invites.map((inv) => ({
      ...inv,
      createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
      expiresAt: inv.expiresAt instanceof Date ? inv.expiresAt.toISOString() : inv.expiresAt,
    })),
  })
}

const CreateInviteSchema = z.object({
  code: z.string().optional(),
  maxUses: z.number().int().positive().optional().nullable(),
})

export async function POST(req: NextRequest) {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateInviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 })
  }

  const code = parsed.data.code?.toUpperCase() || generateCode()

  const invite = await createCommunityInvite({
    communityId,
    code,
    createdBy: auth.userId,
    createdAt: new Date(),
    expiresAt: null,
    maxUses: parsed.data.maxUses ?? null,
    useCount: 0,
    isActive: true,
  })

  return NextResponse.json({ invite }, { status: 201 })
}
