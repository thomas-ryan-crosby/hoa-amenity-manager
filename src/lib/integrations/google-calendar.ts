import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { Booking } from '@/lib/firebase/db'

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
  const snap = await adminDb
    .collection('bookings')
    .where('amenityId', '==', amenityId)
    .where('status', 'in', ACTIVE_STATUSES)
    .get()

  const conflicts: Booking[] = []

  for (const doc of snap.docs) {
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
 * Check whether an amenity has any active bookings overlapping the given time
 * window. Returns `true` when the slot is free (no conflicts).
 *
 * Kept for backward compatibility — delegates to `getConflictingBookings`.
 */
export async function checkAvailability(
  amenityId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const conflicts = await getConflictingBookings(amenityId, start, end, excludeBookingId)
  return conflicts.length === 0
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
