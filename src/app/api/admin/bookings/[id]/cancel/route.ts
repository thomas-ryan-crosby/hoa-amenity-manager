import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import * as orchestrator from '@/lib/booking/workflow'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params
  await orchestrator.handleCancellation(id)

  return NextResponse.json({ success: true })
}
