import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import { getCommunityMembers, getResidentById } from '@/lib/firebase/db'

// ---------------------------------------------------------------------------
// GET — usage & insights for the active community
// Accessible by property_manager and board roles
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireRole(['property_manager', 'board'])
  if (!auth.ok) return auth.response

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  // Fetch data in parallel
  const [amenitiesSnap, bookingsSnap, members] = await Promise.all([
    adminDb.collection('amenities').where('communityId', '==', communityId).get(),
    adminDb.collection('bookings').where('communityId', '==', communityId).get(),
    getCommunityMembers(communityId),
  ])

  // Amenity lookup
  const amenityMap = new Map<string, string>()
  amenitiesSnap.docs.forEach((d) => amenityMap.set(d.id, d.data().name as string))

  // Active booking statuses (not cancelled/denied/error)
  const activeStatuses = new Set([
    'INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING', 'PENDING_APPROVAL',
    'APPROVED', 'PAYMENT_PENDING', 'CONFIRMED', 'REMINDER_SENT',
    'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'WAITLISTED',
  ])

  // Parse bookings
  const bookings = bookingsSnap.docs.map((d) => {
    const data = d.data()
    const start = data.startDatetime instanceof Timestamp
      ? data.startDatetime.toDate()
      : new Date(data.startDatetime as string)
    const end = data.endDatetime instanceof Timestamp
      ? data.endDatetime.toDate()
      : new Date(data.endDatetime as string)
    const created = data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt as string)
    return {
      amenityId: data.amenityId as string,
      residentId: (data.residentId ?? '') as string,
      status: data.status as string,
      startDatetime: start,
      endDatetime: end,
      createdAt: created,
      durationHours: (end.getTime() - start.getTime()) / (1000 * 60 * 60),
    }
  })

  const activeBookings = bookings.filter((b) => activeStatuses.has(b.status))

  // --- Overview stats ---
  const approvedMembers = members.filter((m) => m.status === 'approved').length
  const pendingMembers = members.filter((m) => m.status === 'pending').length
  const bookingsThisMonth = bookings.filter((b) => b.createdAt >= thisMonthStart).length
  const bookingsLastMonth = bookings.filter(
    (b) => b.createdAt >= lastMonthStart && b.createdAt < thisMonthStart,
  ).length

  // --- Most popular amenities ---
  const amenityBookingCounts: Record<string, { bookings: number; hours: number }> = {}
  for (const b of activeBookings) {
    const entry = amenityBookingCounts[b.amenityId] ?? { bookings: 0, hours: 0 }
    entry.bookings++
    entry.hours += b.durationHours
    amenityBookingCounts[b.amenityId] = entry
  }
  const popularAmenities = Object.entries(amenityBookingCounts)
    .map(([amenityId, data]) => ({
      amenityId,
      name: amenityMap.get(amenityId) ?? 'Unknown',
      bookings: data.bookings,
      totalHours: Math.round(data.hours * 10) / 10,
    }))
    .sort((a, b) => b.bookings - a.bookings)

  // --- Peak days of week ---
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayOfWeekCounts = Array(7).fill(0)
  for (const b of activeBookings) {
    dayOfWeekCounts[b.startDatetime.getDay()]++
  }
  const peakDays = dayNames
    .map((name, i) => ({ day: name, bookings: dayOfWeekCounts[i] }))
    .sort((a, b) => b.bookings - a.bookings)

  // --- Peak hours ---
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
    .slice(0, 8)

  // --- Booking trend (last 6 months) ---
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

  // --- Booking status breakdown ---
  const bookingsByStatus: Record<string, number> = {}
  for (const b of bookings) {
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1
  }

  // --- Most active residents (top 10) ---
  const residentBookingCounts: Record<string, number> = {}
  for (const b of activeBookings) {
    if (b.residentId) {
      residentBookingCounts[b.residentId] = (residentBookingCounts[b.residentId] ?? 0) + 1
    }
  }

  // Resolve names
  const residentIds = Object.keys(residentBookingCounts)
  const residentNameMap = new Map<string, string>()
  // First try members list
  for (const m of members) {
    residentNameMap.set(m.residentId, m.residentId) // placeholder
  }
  // Resolve from residents collection
  const resolvedResidents = await Promise.all(
    residentIds.slice(0, 10).map(async (id) => {
      const resident = await getResidentById(id)
      return { id, name: resident?.name ?? 'Unknown' }
    }),
  )
  for (const r of resolvedResidents) {
    residentNameMap.set(r.id, r.name)
  }

  const topBookers = Object.entries(residentBookingCounts)
    .map(([residentId, count]) => ({
      residentId,
      name: residentNameMap.get(residentId) ?? 'Unknown',
      bookings: count,
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 10)

  // --- Average booking duration by amenity ---
  const avgDuration = popularAmenities.map((a) => ({
    name: a.name,
    avgHours: a.bookings > 0 ? Math.round((a.totalHours / a.bookings) * 10) / 10 : 0,
  }))

  return NextResponse.json({
    overview: {
      totalMembers: approvedMembers,
      pendingMembers,
      totalBookings: bookings.length,
      totalAmenities: amenitiesSnap.size,
      bookingsThisMonth,
      bookingsLastMonth,
    },
    popularAmenities,
    peakDays,
    peakHours,
    monthlyBookings,
    bookingsByStatus,
    topBookers,
    avgDuration,
  })
}
