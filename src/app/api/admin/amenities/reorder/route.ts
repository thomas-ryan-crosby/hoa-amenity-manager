import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { reorderAmenities } from '@/lib/firebase/db'

const ReorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number().int().min(0),
      areaId: z.string().nullable().optional(),
    }),
  ),
})

export async function PUT(req: NextRequest) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const body = await req.json().catch(() => null)
  const parsed = ReorderSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid reorder payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  await reorderAmenities(parsed.data.items)

  return NextResponse.json({ success: true })
}
