import { NextRequest, NextResponse } from 'next/server'
import {
  getAllAmenities,
  getBookingsByStatus,
  getResidentById,
  getResidentByFirebaseUid,
  getAmenityById,
  getInspectionReport,
  getTurnWindowsForAmenity,
  type Amenity,
  type BookingStatus,
  type TurnWindow,
} from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

const AMENITY_COLORS = [
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
  '#F97316',
  '#6366F1',
]

const PENDING_COLOR = '#F59E0B'   // amber — pending approval
const WAITLISTED_COLOR = '#0EA5E9' // sky blue — waitlisted

// Turn windows are always gray — status shown in title text

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const isAdmin = role === 'admin'
  const isJanitorial = role === 'janitorial'

  const statuses: BookingStatus[] = isJanitorial
    ? ['CONFIRMED', 'COMPLETED', 'DISPUTE', 'IN_PROGRESS']
    : isAdmin
      ? ['INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'REMINDER_SENT', 'WAITLISTED']
      : ['INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'CONFIRMED', 'REMINDER_SENT', 'WAITLISTED']

  const communityId = await getActiveCommunityId()

  const [amenities, bookings] = await Promise.all([
    getAllAmenities(communityId ?? undefined),
    getBookingsByStatus(statuses, communityId ?? undefined),
  ])

  const colorMap = new Map<string, string>()
  amenities.forEach((amenity, index) => {
    colorMap.set(amenity.id, AMENITY_COLORS[index % AMENITY_COLORS.length])
  })

  // Build a map of amenityId → all linked amenity IDs (parent + children + siblings)
  const amenityMap = new Map<string, Amenity>()
  amenities.forEach((a) => amenityMap.set(a.id, a))

  function getLinkedIds(amenityId: string): string[] {
    const amenity = amenityMap.get(amenityId)
    if (!amenity) return []
    const linked: string[] = []
    if (amenity.parentAmenityId) {
      linked.push(amenity.parentAmenityId)
      const parent = amenityMap.get(amenity.parentAmenityId)
      if (parent?.childAmenityIds) {
        for (const cid of parent.childAmenityIds) {
          if (cid !== amenityId) linked.push(cid)
        }
      }
    }
    if (amenity.childAmenityIds?.length) {
      linked.push(...amenity.childAmenityIds)
    }
    return [...new Set(linked)]
  }

  const resources = amenities.map((amenity) => ({
    id: amenity.id,
    title: amenity.name,
    eventColor: colorMap.get(amenity.id),
  }))

  // Resolve related data for each booking
  const bookingEvents = await Promise.all(
    bookings.map(async (booking) => {
      const [amenity, resident, inspection, createdByResident] = await Promise.all([
        getAmenityById(booking.amenityId),
        booking.residentId ? getResidentById(booking.residentId) : Promise.resolve(null),
        getInspectionReport(booking.id),
        booking.bookedByStaffId ? getResidentByFirebaseUid(booking.bookedByStaffId).catch(() => null) : Promise.resolve(null),
      ])

      const isEarlyStage = ['INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING'].includes(booking.status)
      const isPending = booking.status === 'PENDING_APPROVAL'
      const isPaymentPending = booking.status === 'PAYMENT_PENDING'
      const isWaitlisted = booking.status === 'WAITLISTED'
      const endTime = booking.endDatetime instanceof Date
        ? booking.endDatetime.getTime()
        : new Date(booking.endDatetime).getTime()
      const inspectionNeeded =
        booking.status === 'CONFIRMED' &&
        endTime < Date.now() &&
        !inspection

      const titlePrefix = isWaitlisted ? '[Waitlisted] ' : ''
      const isAnonymous = booking.anonymous ?? false
      const displayName = booking.bookedByName
        ? booking.bookedByName
        : (resident?.name ?? 'Unknown')
      const displayUnit = resident?.unitNumber ?? ''

      // Public view masks anonymous bookings
      const publicName = isAnonymous && !isAdmin && !isJanitorial ? 'Reserved' : displayName
      const publicUnit = isAnonymous && !isAdmin && !isJanitorial ? '' : displayUnit

      return {
        id: booking.id,
        resourceId: booking.amenityId,
        title: isJanitorial
          ? `${amenity?.name ?? 'Unknown'} setup / inspection`
          : `${titlePrefix}${amenity?.name ?? 'Unknown'} - ${publicName}${publicUnit ? ` (Unit ${publicUnit})` : ''}`,
        start: booking.startDatetime instanceof Date ? booking.startDatetime.toISOString() : booking.startDatetime,
        end: booking.endDatetime instanceof Date ? booking.endDatetime.toISOString() : booking.endDatetime,
        color: isWaitlisted
          ? WAITLISTED_COLOR
          : isEarlyStage
            ? '#EC4899'
            : isPending
              ? PENDING_COLOR
              : isPaymentPending
                ? '#8B5CF6'
                : '#10B981',
        backgroundColor: isWaitlisted
          ? WAITLISTED_COLOR
          : isEarlyStage
            ? '#EC4899'
            : isPending
              ? PENDING_COLOR
              : isPaymentPending
                ? '#8B5CF6'
                : '#10B981',
        borderColor: 'transparent',
        textColor: '#ffffff',
        editable: false,
        extendedProps: {
          type: 'booking' as const,
          amenityId: booking.amenityId,
          amenityName: amenity?.name ?? 'Unknown',
          residentName: (isAdmin || isJanitorial) ? displayName : publicName,
          residentEmail: (isAdmin || isJanitorial) ? (resident?.email ?? '') : (isAnonymous ? '' : (resident?.email ?? '')),
          unitNumber: (isAdmin || isJanitorial) ? displayUnit : publicUnit,
          guestCount: booking.guestCount,
          bookedByName: booking.bookedByName,
          createdByName: booking.bookedByStaffId ? (createdByResident?.name ?? 'Staff') : null,
          feeWaived: booking.feeWaived ?? false,
          anonymous: isAnonymous,
          status: booking.status,
          inspectionStatus: inspection?.status ?? null,
          inspectionNeeded,
        },
      }
    }),
  )

  // Add "blocked by linked amenity" events so bookings show on related calendars
  const linkedEvents: typeof bookingEvents = []
  for (const event of bookingEvents) {
    const linkedIds = getLinkedIds(event.extendedProps.amenityId)
    for (const linkedId of linkedIds) {
      const linkedAmenity = amenityMap.get(linkedId)
      if (!linkedAmenity) continue
      linkedEvents.push({
        ...event,
        id: `linked-${event.id}-${linkedId}`,
        resourceId: linkedId,
        title: `Blocked: ${event.extendedProps.amenityName}`,
        color: '#E7E5E4',
        backgroundColor: '#E7E5E4',
        borderColor: 'transparent',
        textColor: '#57534e',
        editable: false,
        extendedProps: {
          ...event.extendedProps,
          amenityId: linkedId,
          amenityName: linkedAmenity.name,
          type: 'booking' as const,
        },
      })
    }
  }

  // For janitorial view, also include turn windows as calendar events
  let turnWindowEvents: Array<{
    id: string
    resourceId: string
    title: string
    start: string
    end: string
    color: string
    backgroundColor: string
    borderColor: string
    textColor: string
    editable: boolean
    extendedProps: {
      type: 'turn-window'
      amenityId: string
      amenityName: string
      status: string
      turnWindowId: string
      inspectionNeeded: boolean
      inspectionStatus: null
    }
  }> = []

  if (isJanitorial || isAdmin || !role) {
    // Fetch turn windows for all amenities
    const allTurnWindows: Array<TurnWindow & { amenityName: string }> = []

    await Promise.all(
      amenities.map(async (amenity) => {
        const turnWindows = await getTurnWindowsForAmenity(amenity.id)
        for (const tw of turnWindows) {
          allTurnWindows.push({ ...tw, amenityName: amenity.name })
        }
      }),
    )

    turnWindowEvents = allTurnWindows.map((tw) => {
      // Use actual times if janitor has overridden them, otherwise use defaults
      const start = tw.actualStart ?? tw.defaultStart
      const end = tw.actualEnd ?? tw.defaultEnd

      const statusLabel = tw.status === 'COMPLETED' ? 'Done'
        : tw.status === 'SCHEDULED' ? 'Confirmed'
        : 'Default'

      return {
        id: `tw-${tw.id}`,
        resourceId: tw.amenityId,
        title: `Cleaning (${statusLabel}) - ${tw.amenityName}`,
        start: start instanceof Date ? start.toISOString() : String(start),
        end: end instanceof Date ? end.toISOString() : String(end),
        color: tw.status === 'COMPLETED' ? '#A1A1AA' : '#78716C',
        backgroundColor: tw.status === 'COMPLETED' ? '#A1A1AA' : '#78716C',
        borderColor: 'transparent',
        textColor: '#ffffff',
        editable: (isJanitorial || isAdmin) && tw.status !== 'COMPLETED',
        extendedProps: {
          type: 'turn-window' as const,
          amenityId: tw.amenityId,
          amenityName: tw.amenityName,
          status: tw.status,
          turnWindowId: tw.id,
          inspectionNeeded: false,
          inspectionStatus: null,
        },
      }
    })
  }

  // Add linked turn window events too
  const linkedTurnEvents: typeof turnWindowEvents = []
  for (const twEvent of turnWindowEvents) {
    const linkedIds = getLinkedIds(twEvent.extendedProps.amenityId)
    for (const linkedId of linkedIds) {
      const linkedAmenity = amenityMap.get(linkedId)
      if (!linkedAmenity) continue
      linkedTurnEvents.push({
        ...twEvent,
        id: `linked-${twEvent.id}-${linkedId}`,
        resourceId: linkedId,
        title: `Blocked: Cleaning (${twEvent.extendedProps.amenityName})`,
        color: '#E7E5E4',
        backgroundColor: '#E7E5E4',
        borderColor: 'transparent',
        textColor: '#57534e',
        editable: false,
        extendedProps: {
          ...twEvent.extendedProps,
          amenityId: linkedId,
          amenityName: linkedAmenity.name,
        },
      })
    }
  }

  const events = [...bookingEvents, ...linkedEvents, ...turnWindowEvents, ...linkedTurnEvents]

  return NextResponse.json({ events, resources })
}
