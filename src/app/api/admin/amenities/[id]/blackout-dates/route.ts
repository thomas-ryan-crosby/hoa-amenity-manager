import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'

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
  const blackoutDates = await prisma.blackoutDate.findMany({
    where: { amenityId: id },
    orderBy: { startDate: 'asc' },
  })

  return NextResponse.json({
    blackoutDates: blackoutDates.map((blackout) => ({
      ...blackout,
      startDate: blackout.startDate.toISOString(),
      endDate: blackout.endDate.toISOString(),
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

  const blackoutDate = await prisma.blackoutDate.create({
    data: {
      amenityId: id,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      reason: parsed.data.reason ?? null,
      recurring: parsed.data.recurring,
    },
  })

  return NextResponse.json(
    {
      blackoutDate: {
        ...blackoutDate,
        startDate: blackoutDate.startDate.toISOString(),
        endDate: blackoutDate.endDate.toISOString(),
      },
    },
    { status: 201 },
  )
}
