import { adminDb } from '@/lib/firebase/admin'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * Check whether an amenity has any confirmed/pending bookings overlapping the
 * given time window. Returns `true` when the slot is free (no conflicts).
 *
 * This replaces the Google Calendar integration — Firestore is the source of
 * truth for availability.
 */
export async function checkAvailability(
  amenityId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  // A booking conflicts if it overlaps the requested window and is in an
  // active state (not cancelled, denied, failed, or closed).
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

  // Firestore doesn't support compound inequality on two different fields,
  // so we query bookings for this amenity that start before the requested end
  // and then filter in-memory for overlap.
  const snap = await adminDb
    .collection('bookings')
    .where('amenityId', '==', amenityId)
    .where('status', 'in', activeStatuses)
    .get()

  for (const doc of snap.docs) {
    const data = doc.data()
    const bookingStart = data.startDatetime instanceof Timestamp
      ? data.startDatetime.toDate()
      : new Date(data.startDatetime)
    const bookingEnd = data.endDatetime instanceof Timestamp
      ? data.endDatetime.toDate()
      : new Date(data.endDatetime)

    // Overlap check: two ranges overlap if start < otherEnd AND end > otherStart
    if (start < bookingEnd && end > bookingStart) {
      return false // conflict found
    }
  }

  return true // no conflicts
}
