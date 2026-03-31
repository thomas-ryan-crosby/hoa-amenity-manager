import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import {
  getTurnWindowById,
  updateTurnWindow,
  completeTurnWindow,
} from '@/lib/firebase/db'

const UpdateTurnWindowSchema = z.object({
  actualStart: z.string().datetime().transform((s) => new Date(s)),
  actualEnd: z.string().datetime().transform((s) => new Date(s)),
}).refine((data) => data.actualEnd > data.actualStart, {
  message: 'actualEnd must be after actualStart',
  path: ['actualEnd'],
})

const CompleteTurnWindowSchema = z.object({
  action: z.literal('complete'),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['janitorial', 'property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params

  const existing = await getTurnWindowById(id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Turn window not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  if (existing.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Cannot update a completed turn window', code: 'ALREADY_COMPLETED' },
      { status: 400 },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateTurnWindowSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid turn window update payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  await updateTurnWindow(id, {
    actualStart: parsed.data.actualStart,
    actualEnd: parsed.data.actualEnd,
    status: 'SCHEDULED',
  })

  const updated = await getTurnWindowById(id)

  return NextResponse.json({
    turnWindow: updated
      ? {
          id: updated.id,
          bookingId: updated.bookingId,
          amenityId: updated.amenityId,
          staffId: updated.staffId,
          defaultStart: updated.defaultStart instanceof Date ? updated.defaultStart.toISOString() : updated.defaultStart,
          defaultEnd: updated.defaultEnd instanceof Date ? updated.defaultEnd.toISOString() : updated.defaultEnd,
          actualStart: updated.actualStart instanceof Date ? updated.actualStart.toISOString() : updated.actualStart,
          actualEnd: updated.actualEnd instanceof Date ? updated.actualEnd.toISOString() : updated.actualEnd,
          status: updated.status,
          completedAt: updated.completedAt instanceof Date ? updated.completedAt.toISOString() : updated.completedAt,
          createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
        }
      : null,
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['janitorial', 'property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params

  const existing = await getTurnWindowById(id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Turn window not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = CompleteTurnWindowSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid action. Expected { action: "complete" }',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  if (existing.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Turn window is already completed', code: 'ALREADY_COMPLETED' },
      { status: 400 },
    )
  }

  await completeTurnWindow(id)

  return NextResponse.json({ success: true, id })
}
