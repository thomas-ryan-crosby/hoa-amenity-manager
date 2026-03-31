import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import {
  getBlackoutDates,
  addBlackoutDate,
  addAuditLog,
} from '@/lib/firebase/db'

const BlackoutSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().nullable().optional(),
  recurring: z.boolean().default(false),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager', 'board'])
  if (!authState.ok) {
    return authState.response
  }

  const { id } = await params
  const blackoutDates = await getBlackoutDates(id)

  return NextResponse.json({
    blackoutDates: blackoutDates.map((blackout) => ({
      ...blackout,
      startDate: blackout.startDate instanceof Date ? blackout.startDate.toISOString() : blackout.startDate,
      endDate: blackout.endDate instanceof Date ? blackout.endDate.toISOString() : blackout.endDate,
    })),
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = BlackoutSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid blackout date payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const blackoutDate = await addBlackoutDate(id, {
    startDate: new Date(parsed.data.startDate),
    endDate: new Date(parsed.data.endDate),
    reason: parsed.data.reason ?? null,
    recurring: parsed.data.recurring,
  })

  await addAuditLog(id, 'admin', 'BLACKOUT_DATE_ADDED', {
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
  })

  return NextResponse.json(
    {
      blackoutDate: {
        ...blackoutDate,
        startDate: blackoutDate.startDate instanceof Date ? blackoutDate.startDate.toISOString() : blackoutDate.startDate,
        endDate: blackoutDate.endDate instanceof Date ? blackoutDate.endDate.toISOString() : blackoutDate.endDate,
      },
    },
    { status: 201 },
  )
}
