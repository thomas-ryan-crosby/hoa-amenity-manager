import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/client'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resident = await prisma.resident.findUnique({
    where: { clerkUserId: userId },
  })
  if (!resident) {
    return NextResponse.json(
      { error: 'Resident profile not found.' },
      { status: 404 },
    )
  }

  const { id } = await params

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      amenity: {
        select: {
          id: true,
          name: true,
          description: true,
          capacity: true,
          rentalFee: true,
          depositAmount: true,
        },
      },
      auditLogs: {
        orderBy: { timestamp: 'asc' },
        select: {
          id: true,
          agent: true,
          event: true,
          payload: true,
          timestamp: true,
        },
      },
    },
  })

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  // Ensure the booking belongs to the authenticated resident
  if (booking.residentId !== resident.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      startDatetime: booking.startDatetime.toISOString(),
      endDatetime: booking.endDatetime.toISOString(),
      guestCount: booking.guestCount,
      notes: booking.notes,
      calendarEventId: booking.calendarEventId,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      amenity: {
        id: booking.amenity.id,
        name: booking.amenity.name,
        description: booking.amenity.description,
        capacity: booking.amenity.capacity,
        rentalFee: Number(booking.amenity.rentalFee),
        depositAmount: Number(booking.amenity.depositAmount),
      },
      auditLogs: booking.auditLogs.map((log) => ({
        id: log.id,
        agent: log.agent,
        event: log.event,
        payload: log.payload,
        timestamp: log.timestamp.toISOString(),
      })),
    },
  })
}
