import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { getAllAreas, createArea } from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

const AreaSchema = z.object({
  name: z.string().min(1, 'Area name is required'),
})

export async function GET() {
  const communityId = await getActiveCommunityId()
  const areas = await getAllAreas(communityId ?? undefined)
  return NextResponse.json({ areas })
}

export async function POST(req: NextRequest) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const body = await req.json().catch(() => null)
  const parsed = AreaSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid area payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  // Auto-set sortOrder to max + 1
  const communityIdForCreate = await getActiveCommunityId()
  const areas = await getAllAreas(communityIdForCreate ?? undefined)
  const maxSort = areas.reduce((max, a) => Math.max(max, a.sortOrder ?? 0), 0)

  const area = await createArea({
    name: parsed.data.name,
    sortOrder: maxSort + 1,
    ...(communityIdForCreate ? { communityId: communityIdForCreate } : {}),
  })

  return NextResponse.json({ area }, { status: 201 })
}
