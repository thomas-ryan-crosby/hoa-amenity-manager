import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import * as orchestrator from '@/lib/agents/orchestrator'

const DenialSchema = z.object({
  reason: z.string().min(3).max(500),
})

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
  const parsed = DenialSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'A denial reason is required',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  await orchestrator.handleDenial(id, parsed.data.reason)

  return NextResponse.json({ success: true })
}
