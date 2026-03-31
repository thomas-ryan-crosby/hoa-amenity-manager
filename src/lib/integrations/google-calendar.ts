import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * Check whether an amenity has any active bookings overlapping the given time
 * window. Returns `true` when the slot is free (no conflicts).
 *
 * @param excludeBookingId - Exclude this booking from the check (so a booking
 *   doesn't conflict with itself during orchestration).
 */
export async function checkAvailability(
  amenityId: string,
  start: Date,
  end: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const activeStatuses = [
    'INQUIRY_RECEIVED',
    'AVAILABILITY_CHECKING',
    'PENDING_APPROVAL',
    'APPROVED',
    'PAYMENT_PENDING',
    'CONFIRMED',
    'REMINDER_SENT',
    'IN_PROGRESS',
  ]

  const snap = await adminDb
    .collection('bookings')
    .where('amenityId', '==', amenityId)
    .where('status', 'in', activeStatuses)
    .get()

  for (const doc of snap.docs) {
    // Skip the booking being checked
    if (excludeBookingId && doc.id === excludeBookingId) continue

    const data = doc.data()
    const bookingStart = data.startDatetime instanceof Timestamp
      ? data.startDatetime.toDate()
      : new Date(data.startDatetime)
    const bookingEnd = data.endDatetime instanceof Timestamp
      ? data.endDatetime.toDate()
      : new Date(data.endDatetime)

    if (start < bookingEnd && end > bookingStart) {
      return false
    }
  }

  return true
}
