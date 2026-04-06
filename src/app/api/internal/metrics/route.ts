import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '../communities/route'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

// ---------------------------------------------------------------------------
// GET — platform-wide metrics for the internal dashboard
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  // Run all counts in parallel
  const [
    communitiesSnap,
    membersSnap,
    bookingsSnap,
    amenitiesSnap,
    residentsSnap,
  ] = await Promise.all([
    adminDb.collection('communities').get(),
    adminDb.collection('communityMembers').get(),
    adminDb.collection('bookings').get(),
    adminDb.collection('amenities').get(),
    adminDb.collection('residents').get(),
  ])

  const communities = communitiesSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name as string,
      slug: data.slug as string,
      plan: data.plan as string,
      isActive: data.isActive as boolean,
    }
  })
  const members = membersSnap.docs.map((d) => d.data())
  const bookings = bookingsSnap.docs.map((d) => d.data())

  // Community breakdown
  const activeCommunities = communities.filter((c) => c.isActive).length
  const totalCommunities = communities.length

  // Member breakdown
  const totalMembers = members.length
  const pendingMembers = members.filter((m) => m.status === 'pending').length
  const approvedMembers = members.filter((m) => m.status === 'approved').length

  // Booking breakdown
  const totalBookings = bookings.length
  const bookingsByStatus: Record<string, number> = {}
  for (const b of bookings) {
    const status = (b.status as string) ?? 'UNKNOWN'
    bookingsByStatus[status] = (bookingsByStatus[status] ?? 0) + 1
  }

  // Per-community stats
  const communityStats = communities.map((c) => {
    const memberCount = members.filter((m) => m.communityId === c.id).length
    const approvedCount = members.filter(
      (m) => m.communityId === c.id && m.status === 'approved',
    ).length
    const pendingCount = members.filter(
      (m) => m.communityId === c.id && m.status === 'pending',
    ).length
    const bookingCount = bookings.filter((b) => b.communityId === c.id).length
    const amenityCount = amenitiesSnap.docs.filter(
      (d) => d.data().communityId === c.id,
    ).length

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      plan: c.plan,
      isActive: c.isActive,
      memberCount,
      approvedCount,
      pendingCount,
      bookingCount,
      amenityCount,
    }
  })

  // Recent activity — last 20 bookings across all communities
  const recentBookingsSnap = await adminDb
    .collection('bookings')
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()

  const recentBookings = recentBookingsSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      amenityId: data.amenityId,
      status: data.status,
      communityId: data.communityId ?? null,
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      startDatetime:
        data.startDatetime instanceof Timestamp
          ? data.startDatetime.toDate().toISOString()
          : data.startDatetime,
    }
  })

  // Recent members — last 20 join requests
  const recentMembersSnap = await adminDb
    .collection('communityMembers')
    .orderBy('joinedAt', 'desc')
    .limit(20)
    .get()

  const recentMembers = recentMembersSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      communityId: data.communityId,
      userId: data.userId,
      residentId: data.residentId,
      role: data.role,
      status: data.status,
      joinedAt:
        data.joinedAt instanceof Timestamp
          ? data.joinedAt.toDate().toISOString()
          : data.joinedAt,
    }
  })

  return NextResponse.json({
    overview: {
      totalCommunities,
      activeCommunities,
      totalMembers,
      approvedMembers,
      pendingMembers,
      totalBookings,
      totalAmenities: amenitiesSnap.size,
      totalResidents: residentsSnap.size,
    },
    bookingsByStatus,
    communityStats,
    recentBookings,
    recentMembers,
  })
}
