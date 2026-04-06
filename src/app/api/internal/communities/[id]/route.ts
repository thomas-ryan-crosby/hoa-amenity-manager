import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '../route'
import {
  getCommunityById,
  getCommunityMembers,
  getResidentById,
  updateCommunity,
  deleteCommunity,
} from '@/lib/firebase/db'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UpdateCommunitySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes')
    .optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zip: z.string().min(5).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().nullable().optional(),
  plan: z.enum(['free', 'standard', 'premium']).optional(),
  maxAmenities: z.number().int().positive().optional(),
  maxMembers: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// GET — community detail with members
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  const community = await getCommunityById(id)
  if (!community) {
    return NextResponse.json(
      { error: 'Community not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  // Fetch members, amenities, bookings in parallel
  const [members, amenitiesSnap, bookingsSnap] = await Promise.all([
    getCommunityMembers(id),
    adminDb.collection('amenities').where('communityId', '==', id).get(),
    adminDb.collection('bookings').where('communityId', '==', id).get(),
  ])

  // Resolve resident details for each member
  const enrichedMembers = await Promise.all(
    members.map(async (m) => {
      const resident = m.residentId ? await getResidentById(m.residentId) : null
      return {
        ...m,
        name: resident?.name ?? 'Unknown',
        email: resident?.email ?? '',
        phone: resident?.phone ?? null,
        joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : m.joinedAt,
        approvedAt: m.approvedAt instanceof Date ? m.approvedAt.toISOString() : m.approvedAt,
      }
    }),
  )

  // Stats
  const bookings = bookingsSnap.docs.map((d) => d.data())
  const bookingsByStatus: Record<string, number> = {}
  for (const b of bookings) {
    const s = (b.status as string) ?? 'UNKNOWN'
    bookingsByStatus[s] = (bookingsByStatus[s] ?? 0) + 1
  }

  // Recent bookings for this community (last 15)
  const recentBookingsSnap = await adminDb
    .collection('bookings')
    .where('communityId', '==', id)
    .orderBy('createdAt', 'desc')
    .limit(15)
    .get()

  const recentBookings = recentBookingsSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      amenityId: data.amenityId,
      residentId: data.residentId,
      status: data.status,
      startDatetime:
        data.startDatetime instanceof Timestamp
          ? data.startDatetime.toDate().toISOString()
          : data.startDatetime,
      endDatetime:
        data.endDatetime instanceof Timestamp
          ? data.endDatetime.toDate().toISOString()
          : data.endDatetime,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      bookedByName: data.bookedByName ?? null,
    }
  })

  // Amenity names for display
  const amenities = amenitiesSnap.docs.map((d) => ({
    id: d.id,
    name: d.data().name as string,
  }))

  return NextResponse.json({
    community: {
      ...community,
      members: enrichedMembers,
      stats: {
        memberCount: members.length,
        approvedMembers: members.filter((m) => m.status === 'approved').length,
        pendingMembers: members.filter((m) => m.status === 'pending').length,
        amenityCount: amenitiesSnap.size,
        bookingCount: bookingsSnap.size,
        bookingsByStatus,
      },
      amenities,
      recentBookings,
    },
  })
}

// ---------------------------------------------------------------------------
// PUT — update community
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  const body = await req.json().catch(() => null)
  const parsed = UpdateCommunitySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid update payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const existing = await getCommunityById(id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Community not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  await updateCommunity(id, parsed.data)
  const updated = await getCommunityById(id)
  const members = await getCommunityMembers(id)

  return NextResponse.json({
    community: updated ? { ...updated, members } : null,
  })
}

// ---------------------------------------------------------------------------
// DELETE — soft-delete community (set isActive: false)
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  const existing = await getCommunityById(id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Community not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  await deleteCommunity(id)

  return NextResponse.json({ ok: true })
}
