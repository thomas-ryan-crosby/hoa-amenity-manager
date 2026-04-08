import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import {
  getResidentByFirebaseUid,
  getBookingsByResident,
  getAmenityById,
  getBookingById,
  createBookingWithAuditLog,
} from '@/lib/firebase/db'
import * as orchestrator from '@/lib/agents/orchestrator'
import * as residentAgent from '@/lib/agents/resident-agent'
import { getActiveCommunityId } from '@/lib/community'

const CreateBookingSchema = z.object({
  amenityId: z.string().min(1),
  additionalAmenityIds: z.array(z.string()).optional(),
  startDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  endDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  guestCount: z.number().int().positive(),
  notes: z.string().optional(),
  anonymous: z.boolean().optional(),
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

  // Check community membership status (not the legacy resident.status)
  if (authState.communityMemberStatus === 'pending') {
    return NextResponse.json(
      { error: 'Your account is pending approval. You will be notified once a property manager reviews your registration.' },
      { status: 403 },
    )
  }

  if (authState.communityMemberStatus === 'denied') {
    return NextResponse.json(
      { error: 'Your account has not been approved. Please contact the property management office.' },
      { status: 403 },
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

  const { amenityId, additionalAmenityIds, startDatetime, endDatetime, guestCount, notes, anonymous } = parsed.data
  const communityId = await getActiveCommunityId()

  // Create the primary booking
  const booking = await createBookingWithAuditLog(
    {
      residentId: resident.id,
      amenityId,
      status: 'INQUIRY_RECEIVED',
      startDatetime: new Date(startDatetime),
      endDatetime: new Date(endDatetime),
      guestCount,
      notes: notes ?? null,
      anonymous: anonymous ?? false,
      ...(communityId ? { communityId } : {}),
    },
    'api',
    'BOOKING_CREATED',
  )

  // Create additional bookings for suggested amenities
  const additionalBookingIds: string[] = []
  if (additionalAmenityIds?.length) {
    for (const addId of additionalAmenityIds) {
      const addBooking = await createBookingWithAuditLog(
        {
          residentId: resident.id,
          amenityId: addId,
          status: 'INQUIRY_RECEIVED',
          startDatetime: new Date(startDatetime),
          endDatetime: new Date(endDatetime),
          guestCount,
          notes: notes ? `[Bundled booking] ${notes}` : '[Bundled booking]',
          anonymous: anonymous ?? false,
          ...(communityId ? { communityId } : {}),
        },
        'api',
        'BOOKING_CREATED_BUNDLED',
      )
      additionalBookingIds.push(addBooking.id)
    }
  }

  // Send ONE combined booking received email BEFORE orchestration
  // (orchestration may send confirmation/payment emails — order matters)
  const allAmenityIds = [amenityId, ...(additionalAmenityIds ?? [])]
  const amenityNames = await Promise.all(
    allAmenityIds.map(async (id) => {
      const a = await getAmenityById(id)
      return a?.name ?? 'Unknown'
    }),
  )

  try {
    await residentAgent.notifyBookingReceivedMultiple(booking.id, amenityNames)
  } catch (err) {
    console.error(`[Email] Booking received notification failed:`, err)
  }

  // Run orchestration synchronously so turn windows, status transitions,
  // and availability checks are all complete before we respond.
  // This ensures the calendar shows the correct state on refetch.
  try {
    await orchestrator.handleNewBooking(booking.id)
  } catch (err) {
    console.error(`[Orchestrator] Error handling booking ${booking.id}:`, err)
  }
  for (const addId of additionalBookingIds) {
    try {
      await orchestrator.handleNewBooking(addId)
    } catch (err) {
      console.error(`[Orchestrator] Error handling booking ${addId}:`, err)
    }
  }

  // Re-read the booking to get the final status after orchestration
  const finalBooking = await getBookingById(booking.id)

  return NextResponse.json(
    {
      bookingId: booking.id,
      additionalBookingIds,
      status: finalBooking?.status ?? booking.status,
      amenityNames,
    },
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

  const activeCommunityId = await getActiveCommunityId()
  const bookings = await getBookingsByResident(resident.id, activeCommunityId ?? undefined)

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
