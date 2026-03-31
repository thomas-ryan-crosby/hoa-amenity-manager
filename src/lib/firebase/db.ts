import { adminDb } from './admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingStatus =
  | 'INQUIRY_RECEIVED'
  | 'AVAILABILITY_CHECKING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'REMINDER_SENT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'DENIED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'DISPUTE'
  | 'ERROR'
  | 'WAITLISTED'

export type StaffRole = 'PROPERTY_MANAGER' | 'JANITORIAL'
export type InspectionStatus = 'PASS' | 'FLAG'

export interface Resident {
  id: string
  firebaseUid: string
  name: string
  email: string
  phone: string | null
  unitNumber: string
  stripeCustomerId: string | null
}

export interface Amenity {
  id: string
  name: string
  description: string | null
  capacity: number
  rentalFee: number
  depositAmount: number
  requiresApproval: boolean
  autoApproveThreshold: number | null
  approverStaffId: string | null
  escalationHours: number
  fullRefundHours: number
  partialRefundHours: number
  partialRefundPercent: number
  maxAdvanceBookingDays: number
  janitorialAssignment: string
}

export interface BlackoutDate {
  id: string
  startDate: Date
  endDate: Date
  reason: string | null
  recurring: boolean
}

export interface Booking {
  id: string
  residentId: string
  amenityId: string
  status: BookingStatus
  startDatetime: Date
  endDatetime: Date
  guestCount: number
  notes: string | null
  stripePaymentIntentId: string | null
  stripeDepositIntentId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuditLog {
  id: string
  bookingId: string | null
  agent: string
  event: string
  payload: Record<string, unknown> | null
  timestamp: Date
}

export interface InspectionReport {
  id: string
  staffId: string
  status: InspectionStatus
  notes: string | null
  photos: string[]
  submittedAt: Date
}

export interface Staff {
  id: string
  name: string
  email: string
  phone: string | null
  role: StaffRole
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(val: Timestamp | Date | unknown): Date {
  if (val instanceof Timestamp) return val.toDate()
  if (val instanceof Date) return val
  return new Date(val as string)
}

function snapshotToDoc<T extends { id: string }>(
  snap: FirebaseFirestore.DocumentSnapshot,
): T | null {
  if (!snap.exists) return null
  const data = snap.data()!
  return { id: snap.id, ...data } as T
}

// ---------------------------------------------------------------------------
// Collection references
// ---------------------------------------------------------------------------

const residentsCol = () => adminDb.collection('residents')
const amenitiesCol = () => adminDb.collection('amenities')
const bookingsCol = () => adminDb.collection('bookings')
const staffCol = () => adminDb.collection('staff')
const auditLogsCol = () => adminDb.collection('auditLogs')
const inspectionReportsCol = () => adminDb.collection('inspectionReports')

// ---------------------------------------------------------------------------
// RESIDENTS
// ---------------------------------------------------------------------------

export async function getResidentByFirebaseUid(uid: string): Promise<Resident | null> {
  const snap = await residentsCol().where('firebaseUid', '==', uid).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() } as Resident
}

export async function getResidentById(id: string): Promise<Resident | null> {
  const snap = await residentsCol().doc(id).get()
  return snapshotToDoc<Resident>(snap)
}

export async function createResident(data: Omit<Resident, 'id'>): Promise<Resident> {
  const ref = await residentsCol().add(data)
  return { id: ref.id, ...data }
}

export async function updateResident(id: string, data: Partial<Resident>): Promise<void> {
  await residentsCol().doc(id).update(data)
}

// ---------------------------------------------------------------------------
// AMENITIES
// ---------------------------------------------------------------------------

export async function getAllAmenities(): Promise<Amenity[]> {
  const snap = await amenitiesCol().get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Amenity)
}

export async function getAmenityById(id: string): Promise<Amenity | null> {
  const snap = await amenitiesCol().doc(id).get()
  return snapshotToDoc<Amenity>(snap)
}

export async function createAmenity(
  data: Pick<Amenity, 'name' | 'capacity' | 'rentalFee' | 'depositAmount'> & Partial<Omit<Amenity, 'id'>>,
): Promise<Amenity> {
  const fullData: Omit<Amenity, 'id'> = {
    name: data.name,
    description: data.description ?? null,
    capacity: data.capacity,
    rentalFee: data.rentalFee,
    depositAmount: data.depositAmount,
    requiresApproval: data.requiresApproval ?? true,
    autoApproveThreshold: data.autoApproveThreshold ?? null,
    approverStaffId: data.approverStaffId ?? null,
    escalationHours: data.escalationHours ?? 48,
    fullRefundHours: data.fullRefundHours ?? 72,
    partialRefundHours: data.partialRefundHours ?? 24,
    partialRefundPercent: data.partialRefundPercent ?? 50,
    maxAdvanceBookingDays: data.maxAdvanceBookingDays ?? 90,
    janitorialAssignment: data.janitorialAssignment ?? 'rotation',
  }
  const ref = await amenitiesCol().add(fullData)
  return { id: ref.id, ...fullData }
}

export async function updateAmenity(id: string, data: Partial<Amenity>): Promise<void> {
  await amenitiesCol().doc(id).update(data)
}

export async function deleteAmenity(id: string): Promise<void> {
  await amenitiesCol().doc(id).delete()
}

// ---------------------------------------------------------------------------
// BLACKOUT DATES (subcollection under amenities)
// ---------------------------------------------------------------------------

function blackoutDatesCol(amenityId: string) {
  return amenitiesCol().doc(amenityId).collection('blackoutDates')
}

export async function getBlackoutDates(amenityId: string): Promise<BlackoutDate[]> {
  const snap = await blackoutDatesCol(amenityId).get()
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      startDate: toDate(data.startDate),
      endDate: toDate(data.endDate),
      reason: data.reason,
      recurring: data.recurring,
    } as BlackoutDate
  })
}

export async function addBlackoutDate(
  amenityId: string,
  data: Omit<BlackoutDate, 'id'>,
): Promise<BlackoutDate> {
  const ref = await blackoutDatesCol(amenityId).add({
    ...data,
    startDate: Timestamp.fromDate(data.startDate),
    endDate: Timestamp.fromDate(data.endDate),
  })
  return { id: ref.id, ...data }
}

export async function removeBlackoutDate(
  amenityId: string,
  blackoutDateId: string,
): Promise<void> {
  await blackoutDatesCol(amenityId).doc(blackoutDateId).delete()
}

export async function hasBlackoutConflict(
  amenityId: string,
  start: Date,
  end: Date,
): Promise<boolean> {
  const allBlackouts = await getBlackoutDates(amenityId)

  for (const b of allBlackouts) {
    // Standard overlap: blackout.start <= end AND blackout.end >= start
    if (b.startDate <= end && b.endDate >= start) {
      return true
    }

    // For recurring blackout dates, check same month/day across years
    if (b.recurring) {
      const startMonth = b.startDate.getMonth()
      const startDay = b.startDate.getDate()
      const endMonth = b.endDate.getMonth()
      const endDay = b.endDate.getDate()

      // Build a recurring window in the same year as the requested range
      const year = start.getFullYear()
      const recurringStart = new Date(year, startMonth, startDay)
      const recurringEnd = new Date(year, endMonth, endDay, 23, 59, 59, 999)

      if (recurringStart <= end && recurringEnd >= start) {
        return true
      }

      // Also check if the request spans a year boundary
      const nextYear = year + 1
      const recurringStartNext = new Date(nextYear, startMonth, startDay)
      const recurringEndNext = new Date(nextYear, endMonth, endDay, 23, 59, 59, 999)

      if (recurringStartNext <= end && recurringEndNext >= start) {
        return true
      }
    }
  }

  return false
}

// ---------------------------------------------------------------------------
// BOOKINGS
// ---------------------------------------------------------------------------

function bookingFromDoc(doc: FirebaseFirestore.DocumentSnapshot): Booking | null {
  if (!doc.exists) return null
  const data = doc.data()!
  return {
    id: doc.id,
    residentId: data.residentId,
    amenityId: data.amenityId,
    status: data.status,
    startDatetime: toDate(data.startDatetime),
    endDatetime: toDate(data.endDatetime),
    guestCount: data.guestCount,
    notes: data.notes ?? null,
    stripePaymentIntentId: data.stripePaymentIntentId ?? null,
    stripeDepositIntentId: data.stripeDepositIntentId ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

function bookingFromQueryDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): Booking {
  const data = doc.data()
  return {
    id: doc.id,
    residentId: data.residentId,
    amenityId: data.amenityId,
    status: data.status,
    startDatetime: toDate(data.startDatetime),
    endDatetime: toDate(data.endDatetime),
    guestCount: data.guestCount,
    notes: data.notes ?? null,
    stripePaymentIntentId: data.stripePaymentIntentId ?? null,
    stripeDepositIntentId: data.stripeDepositIntentId ?? null,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  }
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const snap = await bookingsCol().doc(id).get()
  return bookingFromDoc(snap)
}

export async function getBookingWithRelations(
  id: string,
): Promise<{ booking: Booking; amenity: Amenity; resident: Resident }> {
  const booking = await getBookingById(id)
  if (!booking) throw new Error(`Booking ${id} not found`)

  const [amenity, resident] = await Promise.all([
    getAmenityById(booking.amenityId),
    getResidentById(booking.residentId),
  ])

  if (!amenity) throw new Error(`Amenity ${booking.amenityId} not found for booking ${id}`)
  if (!resident) throw new Error(`Resident ${booking.residentId} not found for booking ${id}`)
  return { booking, amenity, resident }
}

export async function getBookingsByResident(
  residentId: string,
): Promise<(Booking & { amenityName: string })[]> {
  const snap = await bookingsCol()
    .where('residentId', '==', residentId)
    .get()

  const bookings = snap.docs
    .map(bookingFromQueryDoc)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // Fetch amenity names in parallel
  const amenityIds = [...new Set(bookings.map((b) => b.amenityId))]
  const amenityMap = new Map<string, string>()
  await Promise.all(
    amenityIds.map(async (aid) => {
      const amenity = await getAmenityById(aid)
      if (amenity) amenityMap.set(aid, amenity.name)
    }),
  )

  return bookings.map((b) => ({
    ...b,
    amenityName: amenityMap.get(b.amenityId) ?? 'Unknown',
  }))
}

export async function getBookingsByStatus(statuses: BookingStatus[]): Promise<Booking[]> {
  const snap = await bookingsCol().where('status', 'in', statuses).get()
  return snap.docs.map(bookingFromQueryDoc)
}

/**
 * Get waitlisted bookings for a specific amenity + time range, ordered by
 * createdAt ascending (earliest waitlisted booking first).
 */
export async function getWaitlistedBookingsForSlot(
  amenityId: string,
  start: Date,
  end: Date,
): Promise<Booking[]> {
  const snap = await bookingsCol()
    .where('amenityId', '==', amenityId)
    .where('status', '==', 'WAITLISTED')
    .get()

  return snap.docs
    .map(bookingFromQueryDoc)
    .filter((b) => b.startDatetime < end && b.endDatetime > start)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
}

export async function createBooking(
  data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Booking> {
  const now = new Date()
  const docData = {
    ...data,
    startDatetime: Timestamp.fromDate(data.startDatetime),
    endDatetime: Timestamp.fromDate(data.endDatetime),
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  }
  const ref = await bookingsCol().add(docData)
  return {
    id: ref.id,
    ...data,
    createdAt: now,
    updatedAt: now,
  }
}

export async function updateBooking(id: string, data: Partial<Booking>): Promise<void> {
  const updateData: Record<string, unknown> = { ...data }

  // Convert Date fields to Timestamps for Firestore
  if (data.startDatetime) updateData.startDatetime = Timestamp.fromDate(data.startDatetime)
  if (data.endDatetime) updateData.endDatetime = Timestamp.fromDate(data.endDatetime)

  updateData.updatedAt = FieldValue.serverTimestamp()

  // Remove id from update payload if present
  delete updateData.id

  await bookingsCol().doc(id).update(updateData)
}

// ---------------------------------------------------------------------------
// AUDIT LOGS
// ---------------------------------------------------------------------------

function bookingAuditLogsCol(bookingId: string) {
  return bookingsCol().doc(bookingId).collection('auditLogs')
}

export async function addAuditLog(
  bookingId: string | null,
  agent: string,
  event: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const logData = {
    bookingId,
    agent,
    event,
    payload: payload ?? null,
    timestamp: FieldValue.serverTimestamp(),
  }

  if (bookingId) {
    // Store in booking subcollection
    await bookingAuditLogsCol(bookingId).add(logData)
  } else {
    // Store in top-level auditLogs collection
    await auditLogsCol().add(logData)
  }
}

export async function getBookingAuditLogs(bookingId: string): Promise<AuditLog[]> {
  const snap = await bookingAuditLogsCol(bookingId)
    .orderBy('timestamp', 'asc')
    .get()

  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      bookingId,
      agent: data.agent,
      event: data.event,
      payload: data.payload ?? null,
      timestamp: toDate(data.timestamp),
    } as AuditLog
  })
}

// ---------------------------------------------------------------------------
// STAFF
// ---------------------------------------------------------------------------

export async function getAllStaff(): Promise<Staff[]> {
  const snap = await staffCol().get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Staff)
}

export async function getStaffById(id: string): Promise<Staff | null> {
  const snap = await staffCol().doc(id).get()
  return snapshotToDoc<Staff>(snap)
}

export async function getStaffByRole(role: StaffRole): Promise<Staff[]> {
  const snap = await staffCol().where('role', '==', role).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Staff)
}

export async function createStaff(data: Omit<Staff, 'id'>): Promise<Staff> {
  const ref = await staffCol().add(data)
  return { id: ref.id, ...data }
}

export async function updateStaff(id: string, data: Partial<Staff>): Promise<void> {
  await staffCol().doc(id).update(data)
}

export async function deleteStaff(id: string): Promise<void> {
  await staffCol().doc(id).delete()
}

// ---------------------------------------------------------------------------
// INSPECTION REPORTS (keyed by bookingId)
// ---------------------------------------------------------------------------

export async function getInspectionReport(bookingId: string): Promise<InspectionReport | null> {
  const snap = await inspectionReportsCol().doc(bookingId).get()
  if (!snap.exists) return null
  const data = snap.data()!
  return {
    id: snap.id,
    staffId: data.staffId,
    status: data.status,
    notes: data.notes ?? null,
    photos: data.photos ?? [],
    submittedAt: toDate(data.submittedAt),
  } as InspectionReport
}

export async function upsertInspectionReport(
  bookingId: string,
  data: Omit<InspectionReport, 'id' | 'submittedAt'>,
): Promise<InspectionReport> {
  const now = new Date()
  const docData = {
    ...data,
    submittedAt: Timestamp.fromDate(now),
  }
  await inspectionReportsCol().doc(bookingId).set(docData, { merge: true })
  return {
    id: bookingId,
    ...data,
    submittedAt: now,
  }
}

export async function countRecentInspectionsByStaff(
  staffIds: string[],
  sinceDays: number,
): Promise<Map<string, number>> {
  const since = new Date()
  since.setDate(since.getDate() - sinceDays)

  const snap = await inspectionReportsCol()
    .where('staffId', 'in', staffIds)
    .where('submittedAt', '>=', Timestamp.fromDate(since))
    .get()

  const counts = new Map<string, number>()
  for (const sid of staffIds) {
    counts.set(sid, 0)
  }
  for (const doc of snap.docs) {
    const staffId = doc.data().staffId as string
    counts.set(staffId, (counts.get(staffId) ?? 0) + 1)
  }
  return counts
}

// ---------------------------------------------------------------------------
// TRANSACTIONS
// ---------------------------------------------------------------------------

export async function createBookingWithAuditLog(
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'stripePaymentIntentId' | 'stripeDepositIntentId'> & Partial<Pick<Booking, 'stripePaymentIntentId' | 'stripeDepositIntentId'>>,
  agent: string,
  event: string,
): Promise<Booking> {
  const batch = adminDb.batch()
  const now = new Date()
  const nowTs = Timestamp.fromDate(now)

  const bookingRef = bookingsCol().doc()
  const fullBookingData = {
    ...bookingData,
    stripePaymentIntentId: bookingData.stripePaymentIntentId ?? null,
    stripeDepositIntentId: bookingData.stripeDepositIntentId ?? null,
    startDatetime: Timestamp.fromDate(bookingData.startDatetime),
    endDatetime: Timestamp.fromDate(bookingData.endDatetime),
    createdAt: nowTs,
    updatedAt: nowTs,
  }
  batch.set(bookingRef, fullBookingData)

  const auditRef = bookingRef.collection('auditLogs').doc()
  batch.set(auditRef, {
    bookingId: bookingRef.id,
    agent,
    event,
    payload: null,
    timestamp: nowTs,
  })

  await batch.commit()

  return {
    id: bookingRef.id,
    ...bookingData,
    stripePaymentIntentId: bookingData.stripePaymentIntentId ?? null,
    stripeDepositIntentId: bookingData.stripeDepositIntentId ?? null,
    createdAt: now,
    updatedAt: now,
  }
}

export async function transitionBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  agent: string,
  payload?: Record<string, unknown>,
): Promise<void> {
  const batch = adminDb.batch()

  const bookingRef = bookingsCol().doc(bookingId)
  batch.update(bookingRef, {
    status: newStatus,
    updatedAt: FieldValue.serverTimestamp(),
  })

  const auditRef = bookingRef.collection('auditLogs').doc()
  batch.set(auditRef, {
    bookingId,
    agent,
    event: `status_transition:${newStatus}`,
    payload: payload ?? null,
    timestamp: FieldValue.serverTimestamp(),
  })

  await batch.commit()
}

// ---------------------------------------------------------------------------
// SYSTEM SETTINGS (singleton document at /settings/global)
// ---------------------------------------------------------------------------

export interface SystemSettings {
  pmEmail: string
  approvalJwtSecret: string
  twilioPhoneNumber: string
  orgName: string
}

const DEFAULT_SETTINGS: SystemSettings = {
  pmEmail: '',
  approvalJwtSecret: '',
  twilioPhoneNumber: '',
  orgName: 'Sanctuary HOA',
}

export async function getSettings(): Promise<SystemSettings> {
  const doc = await adminDb.collection('settings').doc('global').get()
  if (!doc.exists) return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...doc.data() } as SystemSettings
}

export async function updateSettings(data: Partial<SystemSettings>): Promise<void> {
  await adminDb.collection('settings').doc('global').set(data, { merge: true })
}
