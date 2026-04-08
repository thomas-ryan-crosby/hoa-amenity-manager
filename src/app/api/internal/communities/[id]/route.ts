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
  timezone: z.string().min(1).optional(),
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

  // Amenity lookup
  const amenityMap = new Map<string, string>()
  amenitiesSnap.docs.forEach((d) => amenityMap.set(d.id, d.data().name as string))

  // Parse bookings with dates
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const bookings = bookingsSnap.docs.map((d) => {
    const data = d.data()
    const start = data.startDatetime instanceof Timestamp
      ? data.startDatetime.toDate()
      : new Date(data.startDatetime as string)
    const created = data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt as string)
    return {
      id: d.id,
      amenityId: data.amenityId as string,
      status: data.status as string,
      startDatetime: start,
      createdAt: created,
    }
  })

  // Active bookings (not cancelled/denied)
  const activeStatuses = new Set([
    'INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING', 'PENDING_APPROVAL',
    'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'REMINDER_SENT',
    'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'WAITLISTED',
  ])
  const activeBookings = bookings.filter((b) => activeStatuses.has(b.status))

  // --- Usage Insights ---

  // 1. Most popular amenities (by booking count)
  const amenityBookingCounts: Record<string, number> = {}
  for (const b of activeBookings) {
    amenityBookingCounts[b.amenityId] = (amenityBookingCounts[b.amenityId] ?? 0) + 1
  }
  const popularAmenities = Object.entries(amenityBookingCounts)
    .map(([amenityId, count]) => ({
      amenityId,
      name: amenityMap.get(amenityId) ?? 'Unknown',
      bookings: count,
    }))
    .sort((a, b) => b.bookings - a.bookings)

  // 2. Peak days of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayOfWeekCounts = Array(7).fill(0)
  for (const b of activeBookings) {
    dayOfWeekCounts[b.startDatetime.getDay()]++
  }
  const peakDays = dayNames
    .map((name, i) => ({ day: name, bookings: dayOfWeekCounts[i] }))
    .sort((a, b) => b.bookings - a.bookings)

  // 3. Peak hours
  const hourCounts = Array(24).fill(0)
  for (const b of activeBookings) {
    hourCounts[b.startDatetime.getHours()]++
  }
  const peakHours = hourCounts
    .map((count, hour) => ({
      hour,
      label: `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? 'am' : 'pm'}`,
      bookings: count,
    }))
    .filter((h) => h.bookings > 0)
    .sort((a, b) => b.bookings - a.bookings)

  // 4. Bookings by month (last 6 months)
  const monthlyBookings: { month: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const label = mStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    const count = bookings.filter(
      (b) => b.createdAt >= mStart && b.createdAt < mEnd,
    ).length
    monthlyBookings.push({ month: label, count })
  }

  // 5. Booking status breakdown
  const bookingsByStatus: Record<string, number> = {}
  for (const b of bookings) {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1
  }

  // 6. This month vs last month
  const bookingsThisMonth = bookings.filter((b) => b.createdAt >= thisMonthStart).length
  const bookingsLastMonth = bookings.filter(
    (b) => b.createdAt >= lastMonthStart && b.createdAt < thisMonthStart,
  ).length

  // 7. Top bookers (residents with most bookings)
  const residentBookingCounts: Record<string, number> = {}
  for (const b of activeBookings) {
    // Use amenityId as a proxy — we'll resolve names from members
  }
  // Actually count by residentId from raw data
  for (const d of bookingsSnap.docs) {
    const data = d.data()
    if (activeStatuses.has(data.status as string)) {
      const rid = data.residentId as string
      if (rid) residentBookingCounts[rid] = (residentBookingCounts[rid] ?? 0) + 1
    }
  }
  const residentNameMap = new Map<string, string>()
  for (const m of enrichedMembers) {
    residentNameMap.set(m.residentId, m.name)
  }
  const topBookers = Object.entries(residentBookingCounts)
    .map(([residentId, count]) => ({
      residentId,
      name: residentNameMap.get(residentId) ?? 'Unknown',
      bookings: count,
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10)

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
        bookingsThisMonth,
        bookingsLastMonth,
        bookingsByStatus,
      },
      usage: {
        popularAmenities,
        peakDays,
        peakHours: peakHours.slice(0, 8),
        monthlyBookings,
        topBookers,
      },
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
