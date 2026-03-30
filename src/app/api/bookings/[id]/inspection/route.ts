import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'
import * as orchestrator from '@/lib/agents/orchestrator'

const InspectionSchema = z.object({
  status: z.enum(['PASS', 'FLAG']),
  notes: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['janitorial', 'property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = InspectionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid inspection payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const staff = await prisma.staff.findFirst({
    where: authState.role === 'property_manager'
      ? { role: 'PROPERTY_MANAGER' }
      : { role: 'JANITORIAL' },
    orderBy: { name: 'asc' },
  })

  if (!staff) {
    return NextResponse.json(
      { error: 'No staff record found', code: 'STAFF_NOT_FOUND' },
      { status: 404 },
    )
  }

  const report = await prisma.inspectionReport.upsert({
    where: { bookingId: id },
    update: {
      staffId: staff.id,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      photos: parsed.data.photos ?? [],
      submittedAt: new Date(),
    },
    create: {
      bookingId: id,
      staffId: staff.id,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      photos: parsed.data.photos ?? [],
    },
  })

  await orchestrator.handleInspectionComplete(id, parsed.data.status)

  return NextResponse.json(
    {
      inspectionReport: {
        ...report,
        submittedAt: report.submittedAt.toISOString(),
      },
    },
    { status: 201 },
  )
}
