import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import {
  getCommunityBySlug,
  getAllAmenities,
  getResidentByFirebaseUid,
  createBookingWithAuditLog,
  getBookingById,
} from '@/lib/firebase/db'
import * as orchestrator from '@/lib/booking/workflow'

// ---------------------------------------------------------------------------
// GET — list externally-bookable amenities for a community
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  const community = await getCommunityBySlug(slug)
  if (!community || !community.isActive) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  const amenities = await getAllAmenities(community.id)
  const external = amenities
    .filter((a) => a.allowExternalBooking)
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      capacity: a.capacity,
      rentalFee: a.rentalFee,
      depositAmount: a.depositAmount,
      externalRentalFee: a.externalRentalFee ?? 0,
      externalDepositAmount: a.externalDepositAmount ?? 0,
    }))

  return NextResponse.json({
    community: {
      name: community.name,
      city: community.city,
      state: community.state,
    },
    amenities: external,
  })
}

// ---------------------------------------------------------------------------
// POST — create an external booking
// ---------------------------------------------------------------------------

const ExternalBookingSchema = z.object({
  amenityId: z.string().min(1),
  startDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  endDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  guestCount: z.number().int().positive(),
  notes: z.string().nullable().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Require authentication
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const { slug } = await params

  const community = await getCommunityBySlug(slug)
  if (!community || !community.isActive) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  // Get the user's resident profile
  const resident = await getResidentByFirebaseUid(auth.userId)
  if (!resident) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = ExternalBookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid booking data', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { amenityId, startDatetime, endDatetime, guestCount, notes } = parsed.data

  // Verify the amenity allows external booking
  const amenities = await getAllAmenities(community.id)
  const amenity = amenities.find((a) => a.id === amenityId)
  if (!amenity || !amenity.allowExternalBooking) {
    return NextResponse.json({ error: 'This amenity is not available for external booking' }, { status: 400 })
  }

  // Create the booking with isExternal flag, linked to the user's resident profile
  const booking = await createBookingWithAuditLog(
    {
      residentId: resident.id,
      amenityId,
      status: 'INQUIRY_RECEIVED',
      startDatetime: new Date(startDatetime),
      endDatetime: new Date(endDatetime),
      guestCount,
      notes: notes ?? null,
      anonymous: false,
      isExternal: true,
      bookedByName: resident.name,
      bookedByEmail: resident.email,
      bookedByPhone: resident.phone ?? null,
      bookedByStaffId: null,
      sendCommsToBookee: true,
      feeWaived: false,
      communityId: community.id,
    },
    'external',
    'EXTERNAL_BOOKING_CREATED',
  )

  // Run orchestration synchronously
  try {
    await orchestrator.handleNewBooking(booking.id)
  } catch (err) {
    console.error(`[External Booking] Orchestrator error for ${booking.id}:`, err)
  }

  const finalBooking = await getBookingById(booking.id)

  return NextResponse.json({
    bookingId: booking.id,
    status: finalBooking?.status ?? booking.status,
  }, { status: 201 })
}
