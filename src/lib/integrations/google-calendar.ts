import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { Booking, TurnWindow } from '@/lib/firebase/db'
import { getActiveTurnWindows, getLinkedAmenityIds } from '@/lib/firebase/db'

/** Statuses considered "active" — these bookings occupy a time slot. */
const ACTIVE_STATUSES = [
  'INQUIRY_RECEIVED',
  'AVAILABILITY_CHECKING',
  'PENDING_APPROVAL',
  'APPROVED',
  'PAYMENT_PENDING',
  'CONFIRMED',
  'REMINDER_SENT',
  'IN_PROGRESS',
]

/**
 * Return all active bookings that overlap the given time window for an amenity.
 *
 * @param excludeBookingId - Exclude this booking from the results (so a booking
 *   doesn't conflict with itself during orchestration).
 */
export async function getConflictingBookings(
  amenityId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<Booking[]> {
  // Check this amenity + all linked amenities (parent, children, siblings)
  const linkedIds = await getLinkedAmenityIds(amenityId)
  const allAmenityIds = [amenityId, ...linkedIds]

  // Firestore doesn't allow two 'in' operators, so query per amenity
  const snapshots = await Promise.all(
    allAmenityIds.map((aid) =>
      adminDb
        .collection('bookings')
        .where('amenityId', '==', aid)
        .where('status', 'in', ACTIVE_STATUSES)
        .get()
    ),
  )
  const allDocs = snapshots.flatMap((s) => s.docs)

  const conflicts: Booking[] = []

  for (const doc of allDocs) {
    if (excludeBookingId && doc.id === excludeBookingId) continue

    const data = doc.data()
    const bookingStart = data.startDatetime instanceof Timestamp
      ? data.startDatetime.toDate()
      : new Date(data.startDatetime)
    const bookingEnd = data.endDatetime instanceof Timestamp
      ? data.endDatetime.toDate()
      : new Date(data.endDatetime)

    if (start < bookingEnd && end > bookingStart) {
      conflicts.push({
        id: doc.id,
        residentId: data.residentId,
        amenityId: data.amenityId,
        status: data.status,
        startDatetime: bookingStart,
        endDatetime: bookingEnd,
        guestCount: data.guestCount,
        notes: data.notes ?? null,
        stripePaymentIntentId: data.stripePaymentIntentId ?? null,
        stripeDepositIntentId: data.stripeDepositIntentId ?? null,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      })
    }
  }

  return conflicts
}

/**
 * Return both booking conflicts and turn window conflicts for a given amenity
 * and time range. Turn windows use actualStart/actualEnd when SCHEDULED,
 * otherwise defaultStart/defaultEnd.
 */
export async function getBlockedPeriods(
  amenityId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<{ bookingConflicts: Booking[]; turnWindowConflicts: TurnWindow[] }> {
  const linkedIds = await getLinkedAmenityIds(amenityId)
  const allAmenityIds = [amenityId, ...linkedIds]

  const [bookingConflicts, ...turnWindowArrays] = await Promise.all([
    getConflictingBookings(amenityId, start, end, excludeBookingId),
    ...allAmenityIds.map((aid) => getActiveTurnWindows(aid)),
  ])
  const activeTurnWindows = turnWindowArrays.flat()

  const turnWindowConflicts: TurnWindow[] = []

  for (const tw of activeTurnWindows) {
    // Skip turn windows that belong to the excluded booking
    if (excludeBookingId && tw.bookingId === excludeBookingId) continue

    // Use actual times if the janitor has overridden them (SCHEDULED), otherwise defaults
    const twStart = tw.actualStart ?? tw.defaultStart
    const twEnd = tw.actualEnd ?? tw.defaultEnd

    // Standard overlap check
    if (start < twEnd && end > twStart) {
      turnWindowConflicts.push(tw)
    }
  }

  return { bookingConflicts, turnWindowConflicts }
}

/**
 * Check whether an amenity has any active bookings or turn windows overlapping
 * the given time window. Returns `true` when the slot is free (no conflicts).
 */
export async function checkAvailability(
  amenityId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const { bookingConflicts, turnWindowConflicts } = await getBlockedPeriods(
    amenityId,
    start,
    end,
    excludeBookingId,
  )
  return bookingConflicts.length === 0 && turnWindowConflicts.length === 0
}

/**
 * Returns `true` when there is at least one active booking overlapping the
 * given time window. This is the inverse of `checkAvailability` and reads more
 * naturally when you want to know "are there existing bookings?".
 */
export async function hasExistingBookings(
  amenityId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const conflicts = await getConflictingBookings(amenityId, start, end, excludeBookingId)
  return conflicts.length > 0
}
