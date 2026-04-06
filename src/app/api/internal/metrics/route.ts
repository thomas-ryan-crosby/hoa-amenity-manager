import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '../communities/route'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

// ---------------------------------------------------------------------------
// GET — platform-level metrics for the internal dashboard
// ---------------------------------------------------------------------------

function toISO(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString()
  if (val instanceof Date) return val.toISOString()
  return String(val ?? '')
}

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [communitiesSnap, membersSnap, bookingsSnap] = await Promise.all([
    adminDb.collection('communities').get(),
    adminDb.collection('communityMembers').get(),
    adminDb.collection('bookings').get(),
  ])

  const communities = communitiesSnap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name as string,
      slug: data.slug as string,
      city: (data.city as string) ?? null,
      state: (data.state as string) ?? null,
      plan: data.plan as string,
      isActive: data.isActive as boolean,
      createdAt: toISO(data.createdAt),
    }
  })

  const members = membersSnap.docs.map((d) => {
    const data = d.data()
    return {
      communityId: data.communityId as string,
      status: data.status as string,
      joinedAt: data.joinedAt instanceof Timestamp ? data.joinedAt.toDate() : new Date(data.joinedAt as string),
    }
  })

  const bookings = bookingsSnap.docs.map((d) => {
    const data = d.data()
    return {
      communityId: (data.communityId ?? '') as string,
      status: (data.status ?? '') as string,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt as string),
    }
  })

  // Platform totals
  const totalResidents = members.filter((m) => m.status === 'approved').length
  const totalPending = members.filter((m) => m.status === 'pending').length
  const totalBookings = bookings.length
  const bookingsThisMonth = bookings.filter((b) => b.createdAt >= thisMonthStart).length
  const bookingsLastMonth = bookings.filter(
    (b) => b.createdAt >= lastMonthStart && b.createdAt < thisMonthStart,
  ).length
  const newMembersThisMonth = members.filter((m) => m.joinedAt >= thisMonthStart).length

  // Per-community summary
  const communityOverview = communities.map((c) => {
    const cm = members.filter((m) => m.communityId === c.id)
    const cb = bookings.filter((b) => b.communityId === c.id)

    const residents = cm.filter((m) => m.status === 'approved').length
    const pending = cm.filter((m) => m.status === 'pending').length
    const bThisMonth = cb.filter((b) => b.createdAt >= thisMonthStart).length
    const bLastMonth = cb.filter(
      (b) => b.createdAt >= lastMonthStart && b.createdAt < thisMonthStart,
    ).length
    const newMembersMonth = cm.filter((m) => m.joinedAt >= thisMonthStart).length

    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      city: c.city,
      state: c.state,
      plan: c.plan,
      isActive: c.isActive,
      residents,
      pending,
      totalBookings: cb.length,
      bookingsThisMonth: bThisMonth,
      bookingsLastMonth: bLastMonth,
      bookingsTrend: bLastMonth > 0
        ? Math.round(((bThisMonth - bLastMonth) / bLastMonth) * 100)
        : bThisMonth > 0 ? 100 : 0,
      newMembersThisMonth: newMembersMonth,
    }
  })

  return NextResponse.json({
    platform: {
      totalCommunities: communities.length,
      activeCommunities: communities.filter((c) => c.isActive).length,
      totalResidents,
      totalPending,
      totalBookings,
      bookingsThisMonth,
      bookingsLastMonth,
      newMembersThisMonth,
    },
    communities: communityOverview,
  })
}
