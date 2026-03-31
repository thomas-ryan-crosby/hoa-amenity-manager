import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import {
  getResidentByFirebaseUid,
  getBookingsByResident,
  createBookingWithAuditLog,
} from '@/lib/firebase/db'
import * as orchestrator from '@/lib/agents/orchestrator'

const CreateBookingSchema = z.object({
  amenityId: z.string().min(1),
  startDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  endDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  guestCount: z.number().int().positive(),
  notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const authState = await requireUser()
  if (!authState.ok) {
    return authState.response
  }
  const { userId } = authState

  const resident = await getResidentByFirebaseUid(userId)
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

  const booking = await createBookingWithAuditLog(
    {
      residentId: resident.id,
      amenityId,
      status: 'INQUIRY_RECEIVED',
      startDatetime: new Date(startDatetime),
      endDatetime: new Date(endDatetime),
      guestCount,
      notes: notes ?? null,
    },
    'api',
    'BOOKING_CREATED',
  )

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
  const authState = await requireUser()
  if (!authState.ok) {
    return authState.response
  }
  const { userId } = authState

  const resident = await getResidentByFirebaseUid(userId)
  if (!resident) {
    return NextResponse.json(
      { error: 'Resident profile not found.' },
      { status: 404 },
    )
  }

  const bookings = await getBookingsByResident(resident.id)

  const result = bookings.map((b) => ({
    id: b.id,
    amenityName: b.amenityName,
    startDatetime: b.startDatetime instanceof Date ? b.startDatetime.toISOString() : b.startDatetime,
    endDatetime: b.endDatetime instanceof Date ? b.endDatetime.toISOString() : b.endDatetime,
    guestCount: b.guestCount,
    status: b.status,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
  }))

  return NextResponse.json({ bookings: result })
}
