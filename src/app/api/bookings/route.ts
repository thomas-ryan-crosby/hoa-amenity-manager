import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import * as orchestrator from '@/lib/agents/orchestrator'

const CreateBookingSchema = z.object({
  amenityId: z.string().min(1),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime(),
  guestCount: z.number().int().positive(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resident = await prisma.resident.findUnique({
    where: { clerkUserId: userId },
  })
  if (!resident) {
    return NextResponse.json(
      { error: 'Resident profile not found. Please complete onboarding.' },
      { status: 404 },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { amenityId, startDatetime, endDatetime, guestCount, notes } = parsed.data

  // Create booking and initial audit log in a transaction
  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        residentId: resident.id,
        amenityId,
        status: 'INQUIRY_RECEIVED',
        startDatetime: new Date(startDatetime),
        endDatetime: new Date(endDatetime),
        guestCount,
        notes: notes ?? null,
      },
    })

    await tx.auditLog.create({
      data: {
        bookingId: newBooking.id,
        agent: 'api',
        event: 'BOOKING_CREATED',
        payload: {
          amenityId,
          startDatetime,
          endDatetime,
          guestCount,
          notes: notes ?? null,
        },
      },
    })

    return newBooking
  })

  // Kick off async orchestration (fire-and-forget)
  orchestrator.handleNewBooking(booking.id).catch((err) => {
    console.error(`[Orchestrator] Error handling new booking ${booking.id}:`, err)
  })

  return NextResponse.json(
    { bookingId: booking.id, status: booking.status },
    { status: 201 },
  )
}

export async function GET() {
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

  const bookings = await prisma.booking.findMany({
    where: { residentId: resident.id },
    include: {
      amenity: {
        select: { name: true },
      },
    },
    orderBy: { startDatetime: 'desc' },
  })

  const result = bookings.map((b) => ({
    id: b.id,
    amenityName: b.amenity.name,
    startDatetime: b.startDatetime.toISOString(),
    endDatetime: b.endDatetime.toISOString(),
    guestCount: b.guestCount,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  }))

  return NextResponse.json({ bookings: result })
}
