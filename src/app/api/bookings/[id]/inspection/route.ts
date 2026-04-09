import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { upsertInspectionReport } from '@/lib/firebase/db'
import * as orchestrator from '@/lib/booking/workflow'

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

  const report = await upsertInspectionReport(id, {
    staffId: authState.userId,
    status: parsed.data.status,
    notes: parsed.data.notes ?? null,
    photos: parsed.data.photos ?? [],
  })

  await orchestrator.handleInspectionComplete(id, parsed.data.status)

  return NextResponse.json(
    {
      inspectionReport: {
        ...report,
        submittedAt: report.submittedAt instanceof Date
          ? report.submittedAt.toISOString()
          : report.submittedAt,
      },
    },
    { status: 201 },
  )
}
