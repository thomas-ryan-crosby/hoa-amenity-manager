import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import {
  getBookingWithRelations,
  getBookingAuditLogs,
  getResidentByFirebaseUid,
} from '@/lib/firebase/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireUser()
  if (!authState.ok) {
    return authState.response
  }
  const { userId } = authState

  const { id } = await params

  const result = await getBookingWithRelations(id)
  if (!result) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const { booking, amenity, resident } = result

  // Verify ownership: resident's firebaseUid must match the authenticated user
  if (!resident || resident.firebaseUid !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const auditLogs = await getBookingAuditLogs(id)

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      startDatetime: booking.startDatetime instanceof Date ? booking.startDatetime.toISOString() : booking.startDatetime,
      endDatetime: booking.endDatetime instanceof Date ? booking.endDatetime.toISOString() : booking.endDatetime,
      guestCount: booking.guestCount,
      notes: booking.notes,
      createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
      updatedAt: booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : booking.updatedAt,
      amenity: amenity
        ? {
            id: amenity.id,
            name: amenity.name,
            description: amenity.description,
            capacity: amenity.capacity,
            rentalFee: Number(amenity.rentalFee),
            depositAmount: Number(amenity.depositAmount),
          }
        : null,
      auditLogs: auditLogs.map((log) => ({
        id: log.id,
        agent: log.agent,
        event: log.event,
        payload: log.payload,
        timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
      })),
    },
  })
}
