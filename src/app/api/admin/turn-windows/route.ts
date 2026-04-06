import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { createTurnWindow } from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

const CreateTurnWindowSchema = z.object({
  amenityId: z.string().min(1),
  startDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  endDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  reason: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const authState = await requireRole(['property_manager', 'janitorial'])
  if (!authState.ok) return authState.response

  const body = await req.json().catch(() => null)
  const parsed = CreateTurnWindowSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { amenityId, startDatetime, endDatetime, reason } = parsed.data
  const communityId = await getActiveCommunityId()

  const turnWindow = await createTurnWindow({
    bookingId: '',
    amenityId,
    staffId: authState.userId,
    defaultStart: new Date(startDatetime),
    defaultEnd: new Date(endDatetime),
    actualStart: new Date(startDatetime),
    actualEnd: new Date(endDatetime),
    status: 'SCHEDULED',
    completedAt: null,
    ...(communityId ? { communityId } : {}),
  })

  return NextResponse.json({ turnWindow, reason }, { status: 201 })
}
