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

export type ResidentStatus = 'pending' | 'approved' | 'denied'

export interface Resident {
  id: string
  firebaseUid: string
  name: string
  email: string
  phone: string | null
  unitNumber: string
  stripeCustomerId: string | null
  status: ResidentStatus
  createdAt: Date
}

export interface Area {
  id: string
  name: string
  sortOrder: number
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
  defaultTurnTimeHours: number
  parentAmenityId: string | null
  childAmenityIds: string[]
  suggestedAmenityIds: string[]
  areaId: string | null
  sortOrder: number
  isDefault: boolean               // starred as default on booking calendar
  hasRules: boolean                // requires rule acceptance before booking
  rules: string | null             // rules text shown to residents
  hasAccessInstructions: boolean   // sends access info before booking
  accessInstructions: string | null // access info sent 1hr before event
}

export interface TurnWindow {
  id: string
  bookingId: string
  amenityId: string
  staffId: string | null       // assigned janitorial staff
  defaultStart: Date           // booking end time
  defaultEnd: Date             // booking end + defaultTurnTimeHours
  actualStart: Date | null     // janitorial-set start (drag override)
  actualEnd: Date | null       // janitorial-set end (drag override)
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED'  // PENDING = default block, SCHEDULED = janitor set their window, COMPLETED = done
  completedAt: Date | null
  createdAt: Date
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
  // PM book-on-behalf
  bookedByName: string | null       // generic name if not a platform user
  bookedByEmail: string | null      // contact email for non-platform bookee
  bookedByPhone: string | null      // contact phone for non-platform bookee
  bookedByStaffId: string | null    // PM who created the booking
  sendCommsToBookee: boolean        // whether to CC the bookee on emails
  feeWaived: boolean
  // Privacy
  anonymous: boolean                // masks resident info on public calendar
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

export interface Community {
  id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  timezone: string            // IANA timezone (e.g. 'America/Chicago')
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  plan: 'free' | 'standard' | 'premium'
  isActive: boolean
  maxAmenities: number
  maxMembers: number
  createdAt: Date
  createdBy: string
}

export interface CommunityMember {
  id: string
  communityId: string
  userId: string        // Firebase UID
  residentId: string    // Reference to residents collection
  role: 'admin' | 'resident' | 'property_manager' | 'janitorial' | 'board'
  status: 'pending' | 'approved' | 'denied'
  unitNumber: string
  joinedAt: Date
  approvedBy: string | null
  approvedAt: Date | null
}

export interface CommunityInvite {
  id: string
  communityId: string
  code: string
  createdBy: string
  createdAt: Date
  expiresAt: Date | null
  maxUses: number | null
  useCount: number
  isActive: boolean
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
const areasCol = () => adminDb.collection('areas')
const amenitiesCol = () => adminDb.collection('amenities')
const bookingsCol = () => adminDb.collection('bookings')
const staffCol = () => adminDb.collection('staff')
const auditLogsCol = () => adminDb.collection('auditLogs')
const inspectionReportsCol = () => adminDb.collection('inspectionReports')
const turnWindowsCol = () => adminDb.collection('turnWindows')
const communitiesCol = () => adminDb.collection('communities')
const communityMembersCol = () => adminDb.collection('communityMembers')
const communityInvitesCol = () => adminDb.collection('communityInvites')

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

export async function getAllResidents(communityId?: string): Promise<Resident[]> {
  if (communityId) {
    // Query communityMembers to find residents in this community
    const memberSnap = await communityMembersCol().where('communityId', '==', communityId).get()
    const residentIds = memberSnap.docs
      .map((d) => d.data().residentId as string)
      .filter(Boolean)
    if (residentIds.length === 0) return []
    // Fetch residents by their IDs (Firestore 'in' supports up to 30)
    const residents: Resident[] = []
    for (let i = 0; i < residentIds.length; i += 30) {
      const batch = residentIds.slice(i, i + 30)
      const snap = await residentsCol().where('__name__', 'in', batch).get()
      for (const d of snap.docs) {
        const data = d.data()
        residents.push({
          id: d.id,
          ...data,
          status: data.status ?? 'approved',
          createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
        } as Resident)
      }
    }
    return residents
  }
  const snap = await residentsCol().get()
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      status: data.status ?? 'approved',
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
    } as Resident
  })
}

export async function updateResident(id: string, data: Partial<Resident>): Promise<void> {
  await residentsCol().doc(id).update(data)
}

// ---------------------------------------------------------------------------
// AMENITIES
// ---------------------------------------------------------------------------

export async function getAllAmenities(communityId?: string): Promise<Amenity[]> {
  let query: FirebaseFirestore.Query = amenitiesCol()
  if (communityId) query = query.where('communityId', '==', communityId)
  const snap = await query.get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Amenity)
}

export async function getAmenityById(id: string): Promise<Amenity | null> {
  const snap = await amenitiesCol().doc(id).get()
  return snapshotToDoc<Amenity>(snap)
}

export async function createAmenity(
  data: Pick<Amenity, 'name' | 'capacity' | 'rentalFee' | 'depositAmount'> & Partial<Omit<Amenity, 'id'>> & { communityId?: string },
): Promise<Amenity> {
  const fullData: Omit<Amenity, 'id'> & { communityId?: string } = {
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
    defaultTurnTimeHours: data.defaultTurnTimeHours ?? 0,
    parentAmenityId: data.parentAmenityId ?? null,
    childAmenityIds: data.childAmenityIds ?? [],
    suggestedAmenityIds: data.suggestedAmenityIds ?? [],
    isDefault: data.isDefault ?? false,
    hasRules: data.hasRules ?? false,
    rules: data.rules ?? null,
    hasAccessInstructions: data.hasAccessInstructions ?? false,
    accessInstructions: data.accessInstructions ?? null,
    areaId: data.areaId ?? null,
    sortOrder: data.sortOrder ?? 0,
  }
  if (data.communityId) fullData.communityId = data.communityId
  const ref = await amenitiesCol().add(fullData)
  return { id: ref.id, ...fullData } as Amenity
}

/**
 * If setting isDefault=true, clear isDefault on all other amenities first.
 */
export async function setDefaultAmenity(amenityId: string | null, communityId?: string): Promise<void> {
  const all = await getAllAmenities(communityId)
  await Promise.all(
    all
      .filter((a) => a.isDefault)
      .map((a) => amenitiesCol().doc(a.id).update({ isDefault: false })),
  )
  if (amenityId) {
    await amenitiesCol().doc(amenityId).update({ isDefault: true })
  }
}

export async function updateAmenity(id: string, data: Partial<Amenity>): Promise<void> {
  await amenitiesCol().doc(id).update(data)
}

/**
 * Get all amenity IDs that are linked to the given amenity (parent + children).
 * If "Pickleball Court" is a child of "Tennis Court 3", booking either one
 * should block the other.
 */
export async function getLinkedAmenityIds(amenityId: string): Promise<string[]> {
  const amenity = await getAmenityById(amenityId)
  if (!amenity) return []

  const linked: string[] = []

  // Add parent
  if (amenity.parentAmenityId) {
    linked.push(amenity.parentAmenityId)
    // Also add siblings (other children of the same parent)
    const parent = await getAmenityById(amenity.parentAmenityId)
    if (parent?.childAmenityIds) {
      for (const childId of parent.childAmenityIds) {
        if (childId !== amenityId) linked.push(childId)
      }
    }
  }

  // Add children
  if (amenity.childAmenityIds?.length) {
    linked.push(...amenity.childAmenityIds)
  }

  return [...new Set(linked)]
}

/**
 * Set a parent-child relationship between two amenities.
 * Updates both sides: parent gets child in childAmenityIds, child gets parentAmenityId.
 */
export async function linkAmenities(parentId: string, childId: string): Promise<void> {
  const parent = await getAmenityById(parentId)
  if (!parent) throw new Error(`Parent amenity ${parentId} not found`)

  const childIds = new Set(parent.childAmenityIds ?? [])
  childIds.add(childId)

  await updateAmenity(parentId, { childAmenityIds: [...childIds] })
  await updateAmenity(childId, { parentAmenityId: parentId })
}

/**
 * Remove a parent-child relationship.
 */
export async function unlinkAmenity(childId: string): Promise<void> {
  const child = await getAmenityById(childId)
  if (!child?.parentAmenityId) return

  const parent = await getAmenityById(child.parentAmenityId)
  if (parent) {
    const childIds = (parent.childAmenityIds ?? []).filter((id) => id !== childId)
    await updateAmenity(parent.id, { childAmenityIds: childIds })
  }

  await updateAmenity(childId, { parentAmenityId: null })
}

export async function deleteAmenity(id: string): Promise<void> {
  // Clean up relationships before deleting
  const amenity = await getAmenityById(id)
  if (amenity?.parentAmenityId) {
    await unlinkAmenity(id)
  }
  if (amenity?.childAmenityIds?.length) {
    for (const childId of amenity.childAmenityIds) {
      await updateAmenity(childId, { parentAmenityId: null })
    }
  }
  await amenitiesCol().doc(id).delete()
}

// ---------------------------------------------------------------------------
// AREAS
// ---------------------------------------------------------------------------

export async function getAllAreas(communityId?: string): Promise<Area[]> {
  let query: FirebaseFirestore.Query = areasCol()
  if (communityId) query = query.where('communityId', '==', communityId)
  const snap = await query.get()
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Area))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

export async function getAreaById(id: string): Promise<Area | null> {
  return snapshotToDoc<Area>(await areasCol().doc(id).get())
}

export async function createArea(data: Omit<Area, 'id'> & { communityId?: string }): Promise<Area> {
  const ref = await areasCol().add(data)
  return { id: ref.id, ...data } as Area
}

export async function updateArea(id: string, data: Partial<Area>): Promise<void> {
  await areasCol().doc(id).update(data)
}

export async function deleteArea(id: string, communityId?: string): Promise<void> {
  // Unset areaId on all amenities in this area
  const amenities = await getAllAmenities(communityId)
  await Promise.all(
    amenities
      .filter((a) => a.areaId === id)
      .map((a) => updateAmenity(a.id, { areaId: null })),
  )
  await areasCol().doc(id).delete()
}

/**
 * Get all amenities sorted by area order then amenity order.
 * Returns { areas, amenities, ungrouped } for easy rendering.
 */
export async function getAmenitiesGroupedByArea(communityId?: string): Promise<{
  areas: (Area & { amenities: Amenity[] })[]
  ungrouped: Amenity[]
}> {
  const [areas, amenities] = await Promise.all([getAllAreas(communityId), getAllAmenities(communityId)])

  const areaMap = new Map<string, Amenity[]>()
  const ungrouped: Amenity[] = []

  for (const amenity of amenities) {
    if (amenity.areaId) {
      const list = areaMap.get(amenity.areaId) ?? []
      list.push(amenity)
      areaMap.set(amenity.areaId, list)
    } else {
      ungrouped.push(amenity)
    }
  }

  const groupedAreas = areas.map((area) => ({
    ...area,
    amenities: (areaMap.get(area.id) ?? []).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
  }))

  ungrouped.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return { areas: groupedAreas, ungrouped }
}

/**
 * Reorder amenities — accepts an array of { id, sortOrder, areaId? }.
 */
export async function reorderAmenities(
  items: Array<{ id: string; sortOrder: number; areaId?: string | null }>,
): Promise<void> {
  await Promise.all(
    items.map((item) => {
      const update: Partial<Amenity> = { sortOrder: item.sortOrder }
      if (item.areaId !== undefined) update.areaId = item.areaId
      return updateAmenity(item.id, update)
    }),
  )
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
    bookedByName: data.bookedByName ?? null,
    bookedByEmail: data.bookedByEmail ?? null,
    bookedByPhone: data.bookedByPhone ?? null,
    bookedByStaffId: data.bookedByStaffId ?? null,
    sendCommsToBookee: data.sendCommsToBookee ?? false,
    feeWaived: data.feeWaived ?? false,
    anonymous: data.anonymous ?? false,
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
    bookedByName: data.bookedByName ?? null,
    bookedByEmail: data.bookedByEmail ?? null,
    bookedByPhone: data.bookedByPhone ?? null,
    bookedByStaffId: data.bookedByStaffId ?? null,
    sendCommsToBookee: data.sendCommsToBookee ?? false,
    feeWaived: data.feeWaived ?? false,
    anonymous: data.anonymous ?? false,
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
): Promise<{ booking: Booking; amenity: Amenity; resident: Resident; communityName: string | null; communityTimezone: string }> {
  const booking = await getBookingById(id)
  if (!booking) throw new Error(`Booking ${id} not found`)

  // Read communityId from the raw Firestore doc (not on the TS Booking type)
  const snap = await bookingsCol().doc(id).get()
  const rawCommunityId = snap.data()?.communityId as string | undefined

  const [amenity, resident, community] = await Promise.all([
    getAmenityById(booking.amenityId),
    booking.residentId ? getResidentById(booking.residentId) : Promise.resolve(null),
    rawCommunityId ? getCommunityById(rawCommunityId) : Promise.resolve(null),
  ])

  if (!amenity) throw new Error(`Amenity ${booking.amenityId} not found for booking ${id}`)

  // For book-on-behalf with no linked resident, create a placeholder
  const resolvedResident: Resident = resident ?? {
    id: '',
    firebaseUid: '',
    name: booking.bookedByName ?? 'Guest',
    email: booking.bookedByEmail ?? '',
    phone: booking.bookedByPhone ?? null,
    unitNumber: '',
    stripeCustomerId: null,
    status: 'approved' as const,
    createdAt: booking.createdAt,
  }
  return {
    booking,
    amenity,
    resident: resolvedResident,
    communityName: community?.name ?? null,
    communityTimezone: community?.timezone ?? 'America/Chicago',
  }
}

export async function getBookingsByResident(
  residentId: string,
  communityId?: string,
): Promise<(Booking & { amenityName: string })[]> {
  let query: FirebaseFirestore.Query = bookingsCol()
    .where('residentId', '==', residentId)
  if (communityId) query = query.where('communityId', '==', communityId)
  const snap = await query.get()

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

export async function getBookingsByStatus(statuses: BookingStatus[], communityId?: string): Promise<Booking[]> {
  let query: FirebaseFirestore.Query = bookingsCol().where('status', 'in', statuses)
  if (communityId) query = query.where('communityId', '==', communityId)
  const snap = await query.get()
  return snap.docs.map((d) => bookingFromQueryDoc(d as FirebaseFirestore.QueryDocumentSnapshot))
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

export async function getAllStaff(communityId?: string): Promise<Staff[]> {
  let query: FirebaseFirestore.Query = staffCol()
  if (communityId) query = query.where('communityId', '==', communityId)
  const snap = await query.get()
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

export async function createStaff(data: Omit<Staff, 'id'> & { communityId?: string }): Promise<Staff> {
  const ref = await staffCol().add(data)
  return { id: ref.id, ...data } as Staff
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
  bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'stripePaymentIntentId' | 'stripeDepositIntentId' | 'bookedByName' | 'bookedByEmail' | 'bookedByPhone' | 'bookedByStaffId' | 'sendCommsToBookee' | 'feeWaived' | 'anonymous'> & Partial<Pick<Booking, 'stripePaymentIntentId' | 'stripeDepositIntentId' | 'bookedByName' | 'bookedByEmail' | 'bookedByPhone' | 'bookedByStaffId' | 'sendCommsToBookee' | 'feeWaived' | 'anonymous'>>,
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
    bookedByName: bookingData.bookedByName ?? null,
    bookedByEmail: bookingData.bookedByEmail ?? null,
    bookedByPhone: bookingData.bookedByPhone ?? null,
    bookedByStaffId: bookingData.bookedByStaffId ?? null,
    sendCommsToBookee: bookingData.sendCommsToBookee ?? false,
    feeWaived: bookingData.feeWaived ?? false,
    anonymous: bookingData.anonymous ?? false,
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
    bookedByName: bookingData.bookedByName ?? null,
    bookedByEmail: bookingData.bookedByEmail ?? null,
    bookedByPhone: bookingData.bookedByPhone ?? null,
    bookedByStaffId: bookingData.bookedByStaffId ?? null,
    sendCommsToBookee: bookingData.sendCommsToBookee ?? false,
    feeWaived: bookingData.feeWaived ?? false,
    anonymous: bookingData.anonymous ?? false,
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
// TURN WINDOWS
// ---------------------------------------------------------------------------

function turnWindowFromDoc(doc: FirebaseFirestore.DocumentSnapshot): TurnWindow | null {
  if (!doc.exists) return null
  const data = doc.data()!
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
  }
}

function turnWindowFromQueryDoc(doc: FirebaseFirestore.QueryDocumentSnapshot): TurnWindow {
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
  }
}

export async function createTurnWindow(
  data: Omit<TurnWindow, 'id' | 'createdAt'> & { communityId?: string },
): Promise<TurnWindow> {
  const now = new Date()
  const docData = {
    ...data,
    defaultStart: Timestamp.fromDate(data.defaultStart),
    defaultEnd: Timestamp.fromDate(data.defaultEnd),
    actualStart: data.actualStart ? Timestamp.fromDate(data.actualStart) : null,
    actualEnd: data.actualEnd ? Timestamp.fromDate(data.actualEnd) : null,
    completedAt: data.completedAt ? Timestamp.fromDate(data.completedAt) : null,
    createdAt: Timestamp.fromDate(now),
  }
  const ref = await turnWindowsCol().add(docData)
  return { id: ref.id, ...data, createdAt: now } as TurnWindow
}

export async function getTurnWindowByBookingId(bookingId: string): Promise<TurnWindow | null> {
  const snap = await turnWindowsCol().where('bookingId', '==', bookingId).limit(1).get()
  if (snap.empty) return null
  return turnWindowFromQueryDoc(snap.docs[0])
}

export async function getTurnWindowById(id: string): Promise<TurnWindow | null> {
  const snap = await turnWindowsCol().doc(id).get()
  return turnWindowFromDoc(snap)
}

export async function getTurnWindowsForAmenity(amenityId: string): Promise<TurnWindow[]> {
  const snap = await turnWindowsCol().where('amenityId', '==', amenityId).get()
  return snap.docs.map(turnWindowFromQueryDoc)
}

export async function getActiveTurnWindows(amenityId: string): Promise<TurnWindow[]> {
  const snap = await turnWindowsCol()
    .where('amenityId', '==', amenityId)
    .where('status', 'in', ['PENDING', 'SCHEDULED'])
    .get()
  return snap.docs.map(turnWindowFromQueryDoc)
}

export async function updateTurnWindow(id: string, data: Partial<TurnWindow>): Promise<void> {
  const updateData: Record<string, unknown> = { ...data }

  if (data.defaultStart) updateData.defaultStart = Timestamp.fromDate(data.defaultStart)
  if (data.defaultEnd) updateData.defaultEnd = Timestamp.fromDate(data.defaultEnd)
  if (data.actualStart) updateData.actualStart = Timestamp.fromDate(data.actualStart)
  if (data.actualEnd) updateData.actualEnd = Timestamp.fromDate(data.actualEnd)
  if (data.completedAt) updateData.completedAt = Timestamp.fromDate(data.completedAt)

  delete updateData.id

  await turnWindowsCol().doc(id).update(updateData)
}

export async function deleteTurnWindowByBookingId(bookingId: string): Promise<void> {
  const tw = await getTurnWindowByBookingId(bookingId)
  if (tw) {
    await turnWindowsCol().doc(tw.id).delete()
  }
}

export async function completeTurnWindow(id: string): Promise<void> {
  await turnWindowsCol().doc(id).update({
    status: 'COMPLETED',
    completedAt: Timestamp.fromDate(new Date()),
  })
}

// ---------------------------------------------------------------------------
// COMMUNITIES
// ---------------------------------------------------------------------------

export async function getAllCommunities(): Promise<Community[]> {
  const snap = await communitiesCol().orderBy('name').get()
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
    } as Community
  })
}

export async function getCommunityById(id: string): Promise<Community | null> {
  const doc = await communitiesCol().doc(id).get()
  if (!doc.exists) return null
  const data = doc.data()!
  return { id: doc.id, ...data, createdAt: data.createdAt ? toDate(data.createdAt) : new Date() } as Community
}

export async function getCommunityBySlug(slug: string): Promise<Community | null> {
  const snap = await communitiesCol().where('slug', '==', slug).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc.data()
  return { id: doc.id, ...data, createdAt: data.createdAt ? toDate(data.createdAt) : new Date() } as Community
}

export async function createCommunity(data: Omit<Community, 'id'>): Promise<Community> {
  const ref = await communitiesCol().add({
    ...data,
    createdAt: Timestamp.fromDate(data.createdAt ?? new Date()),
  })
  return { id: ref.id, ...data }
}

export async function updateCommunity(id: string, data: Partial<Community>): Promise<void> {
  await communitiesCol().doc(id).update(data)
}

export async function deleteCommunity(id: string): Promise<void> {
  await communitiesCol().doc(id).delete()
}

// ---------------------------------------------------------------------------
// COMMUNITY MEMBERS
// ---------------------------------------------------------------------------

export async function getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const snap = await communityMembersCol().where('communityId', '==', communityId).get()
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      joinedAt: data.joinedAt ? toDate(data.joinedAt) : new Date(),
      approvedAt: data.approvedAt ? toDate(data.approvedAt) : null,
    } as CommunityMember
  }).sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (b.status === 'pending' && a.status !== 'pending') return 1
    return b.joinedAt.getTime() - a.joinedAt.getTime()
  })
}

export async function getUserCommunities(userId: string): Promise<CommunityMember[]> {
  const snap = await communityMembersCol().where('userId', '==', userId).get()
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      joinedAt: data.joinedAt ? toDate(data.joinedAt) : new Date(),
      approvedAt: data.approvedAt ? toDate(data.approvedAt) : null,
    } as CommunityMember
  })
}

export async function getCommunityMember(userId: string, communityId: string): Promise<CommunityMember | null> {
  const snap = await communityMembersCol()
    .where('userId', '==', userId)
    .where('communityId', '==', communityId)
    .limit(1)
    .get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    joinedAt: data.joinedAt ? toDate(data.joinedAt) : new Date(),
    approvedAt: data.approvedAt ? toDate(data.approvedAt) : null,
  } as CommunityMember
}

export async function createCommunityMember(data: Omit<CommunityMember, 'id'>): Promise<CommunityMember> {
  const ref = await communityMembersCol().add({
    ...data,
    joinedAt: Timestamp.fromDate(data.joinedAt ?? new Date()),
    approvedAt: data.approvedAt ? Timestamp.fromDate(data.approvedAt) : null,
  })
  return { id: ref.id, ...data }
}

export async function updateCommunityMember(id: string, data: Partial<CommunityMember>): Promise<void> {
  const update: Record<string, unknown> = { ...data }
  if (data.approvedAt) update.approvedAt = Timestamp.fromDate(data.approvedAt)
  if (data.joinedAt) update.joinedAt = Timestamp.fromDate(data.joinedAt)
  await communityMembersCol().doc(id).update(update)
}

// ---------------------------------------------------------------------------
// COMMUNITY INVITES
// ---------------------------------------------------------------------------

export async function getInviteByCode(code: string): Promise<CommunityInvite | null> {
  const snap = await communityInvitesCol().where('code', '==', code.toUpperCase()).limit(1).get()
  if (snap.empty) return null
  const doc = snap.docs[0]
  const data = doc.data()
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
    expiresAt: data.expiresAt ? toDate(data.expiresAt) : null,
  } as CommunityInvite
}

export async function getCommunityInvites(communityId: string): Promise<CommunityInvite[]> {
  const snap = await communityInvitesCol().where('communityId', '==', communityId).get()
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
      expiresAt: data.expiresAt ? toDate(data.expiresAt) : null,
    } as CommunityInvite
  })
}

export async function createCommunityInvite(data: Omit<CommunityInvite, 'id'>): Promise<CommunityInvite> {
  const ref = await communityInvitesCol().add({
    ...data,
    code: data.code.toUpperCase(),
    createdAt: Timestamp.fromDate(data.createdAt ?? new Date()),
    expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null,
  })
  return { id: ref.id, ...data }
}

export async function incrementInviteUseCount(inviteId: string): Promise<void> {
  await communityInvitesCol().doc(inviteId).update({
    useCount: FieldValue.increment(1),
  })
}

export async function deactivateInvite(inviteId: string): Promise<void> {
  await communityInvitesCol().doc(inviteId).update({ isActive: false })
}

// ---------------------------------------------------------------------------
// SYSTEM SETTINGS (singleton document at /settings/global)
// ---------------------------------------------------------------------------

export interface SystemSettings {
  pmEmail: string
  approvalJwtSecret: string
  orgName: string
  defaultAmenityId: string | null
  stripePublishableKey: string
  stripeSecretKey: string
  stripeWebhookSecret: string
  stripeConnected: boolean
}

const DEFAULT_SETTINGS: SystemSettings = {
  pmEmail: '',
  approvalJwtSecret: '',
  orgName: 'Sanctuary HOA',
  defaultAmenityId: null,
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  stripeConnected: false,
}

export async function getSettings(communityId?: string): Promise<SystemSettings> {
  if (communityId) {
    const doc = await adminDb.collection('communities').doc(communityId).collection('settings').doc('general').get()
    if (doc.exists) return { ...DEFAULT_SETTINGS, ...doc.data() } as SystemSettings
  }
  // Fallback to global settings
  const doc = await adminDb.collection('settings').doc('global').get()
  if (!doc.exists) return { ...DEFAULT_SETTINGS }
  return { ...DEFAULT_SETTINGS, ...doc.data() } as SystemSettings
}

export async function updateSettings(data: Partial<SystemSettings>, communityId?: string): Promise<void> {
  if (communityId) {
    await adminDb.collection('communities').doc(communityId).collection('settings').doc('general').set(data, { merge: true })
  } else {
    await adminDb.collection('settings').doc('global').set(data, { merge: true })
  }
}

// ---------------------------------------------------------------------------
// PENDING ADMIN INVITES
// ---------------------------------------------------------------------------

export interface PendingAdminInvite {
  id: string
  communityId: string
  email: string
  name: string
  role: 'admin' | 'property_manager'
  createdBy: string
  createdAt: Date
}

function pendingAdminInvitesCol() {
  return adminDb.collection('pendingAdminInvites')
}

export async function createPendingAdminInvite(
  data: Omit<PendingAdminInvite, 'id'>,
): Promise<PendingAdminInvite> {
  const ref = await pendingAdminInvitesCol().add({
    ...data,
    createdAt: Timestamp.fromDate(data.createdAt),
  })
  return { id: ref.id, ...data }
}

export async function getPendingAdminInvitesByEmail(email: string): Promise<PendingAdminInvite[]> {
  const snap = await pendingAdminInvitesCol()
    .where('email', '==', email.toLowerCase())
    .get()
  return snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      ...data,
      createdAt: data.createdAt ? toDate(data.createdAt) : new Date(),
    } as PendingAdminInvite
  })
}

export async function deletePendingAdminInvite(id: string): Promise<void> {
  await pendingAdminInvitesCol().doc(id).delete()
}
