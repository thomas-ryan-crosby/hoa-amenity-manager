import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { getBookingById, getResidentByFirebaseUid } from '@/lib/firebase/db'
import * as orchestrator from '@/lib/agents/orchestrator'

const CANCELLABLE_STATUSES = [
  'INQUIRY_RECEIVED',
  'AVAILABILITY_CHECKING',
  'PENDING_APPROVAL',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'REMINDER_SENT',
  'WAITLISTED',
]

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireUser()
  if (!authState.ok) return authState.response

  const { id } = await params
  const booking = await getBookingById(id)

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Verify ownership
  const resident = await getResidentByFirebaseUid(authState.userId)
  if (!resident || booking.residentId !== resident.id) {
    return NextResponse.json({ error: 'Not your booking' }, { status: 403 })
  }

  if (!CANCELLABLE_STATUSES.includes(booking.status)) {
    return NextResponse.json(
      { error: `Cannot cancel a booking with status: ${booking.status}` },
      { status: 400 },
    )
  }

  await orchestrator.handleCancellation(id)

  return NextResponse.json({ success: true })
}
