import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { updateBooking } from '@/lib/firebase/db'
import * as orchestrator from '@/lib/booking/workflow'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params
  const body = await req.json().catch(() => ({}))

  // Allow PM to waive fees at approval time
  if (body.feeWaived) {
    await updateBooking(id, { feeWaived: true })
  }

  await orchestrator.handleApproval(id)

  return NextResponse.json({ success: true })
}
