import { NextRequest, NextResponse } from 'next/server'
import {
  getTurnWindowsForAmenity,
  getActiveTurnWindows,
  type TurnWindow,
} from '@/lib/firebase/db'
import { requireUser } from '@/lib/auth'
import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import { getActiveCommunityId } from '@/lib/community'

function toDate(val: Timestamp | Date | unknown): Date {
  if (val instanceof Timestamp) return (val as Timestamp).toDate()
  if (val instanceof Date) return val
  return new Date(val as string)
}

function serializeTurnWindow(tw: TurnWindow) {
  return {
    id: tw.id,
    bookingId: tw.bookingId,
    amenityId: tw.amenityId,
    staffId: tw.staffId,
    defaultStart: tw.defaultStart instanceof Date ? tw.defaultStart.toISOString() : tw.defaultStart,
    defaultEnd: tw.defaultEnd instanceof Date ? tw.defaultEnd.toISOString() : tw.defaultEnd,
    actualStart: tw.actualStart instanceof Date ? tw.actualStart.toISOString() : tw.actualStart,
    actualEnd: tw.actualEnd instanceof Date ? tw.actualEnd.toISOString() : tw.actualEnd,
    status: tw.status,
    completedAt: tw.completedAt instanceof Date ? tw.completedAt.toISOString() : tw.completedAt,
    createdAt: tw.createdAt instanceof Date ? tw.createdAt.toISOString() : tw.createdAt,
  }
}

export async function GET(req: NextRequest) {
  const authState = await requireUser()
  if (!authState.ok) return authState.response

  const { searchParams } = new URL(req.url)
  const amenityId = searchParams.get('amenityId')
  const status = searchParams.get('status') as TurnWindow['status'] | null

  const communityId = await getActiveCommunityId()
  let turnWindows: TurnWindow[] = []

  if (amenityId) {
    turnWindows = await getTurnWindowsForAmenity(amenityId)
  } else {
    // Fetch all turn windows from Firestore directly
    const col = adminDb.collection('turnWindows')
    const snap = communityId
      ? await col.where('communityId', '==', communityId).get()
      : await col.get()
    turnWindows = snap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        bookingId: data.bookingId,
        amenityId: data.amenityId,
        staffId: data.staffId ?? null,
        defaultStart: toDate(data.defaultStart),
        defaultEnd: toDate(data.defaultEnd),
        actualStart: data.actualStart ? toDate(data.actualStart) : null,
        actualEnd: data.actualEnd ? toDate(data.actualEnd) : null,
        status: data.status,
        completedAt: data.completedAt ? toDate(data.completedAt) : null,
        createdAt: toDate(data.createdAt),
      } satisfies TurnWindow
    })
  }

  // Filter by status if provided
  if (status) {
    turnWindows = turnWindows.filter((tw) => tw.status === status)
  }

  return NextResponse.json({
    turnWindows: turnWindows.map(serializeTurnWindow),
  })
}
