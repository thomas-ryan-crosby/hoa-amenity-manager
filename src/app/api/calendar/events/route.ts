import { NextRequest, NextResponse } from 'next/server'
import {
  getAllAmenities,
  getBookingsByStatus,
  getResidentById,
  getAmenityById,
  getInspectionReport,
  getTurnWindowsForAmenity,
  type BookingStatus,
  type TurnWindow,
} from '@/lib/firebase/db'

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

const PENDING_COLOR = '#F59E0B'
const WAITLISTED_COLOR = '#FB923C' // orange-400

const TURN_WINDOW_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',    // amber
  SCHEDULED: '#06B6D4',  // cyan
  COMPLETED: '#22C55E',  // green
}

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

  const [amenities, bookings] = await Promise.all([
    getAllAmenities(),
    getBookingsByStatus(statuses),
  ])

  const colorMap = new Map<string, string>()
  amenities.forEach((amenity, index) => {
    colorMap.set(amenity.id, AMENITY_COLORS[index % AMENITY_COLORS.length])
  })

  const resources = amenities.map((amenity) => ({
    id: amenity.id,
    title: amenity.name,
    eventColor: colorMap.get(amenity.id),
  }))

  // Resolve related data for each booking
  const bookingEvents = await Promise.all(
    bookings.map(async (booking) => {
      const [amenity, resident, inspection] = await Promise.all([
        getAmenityById(booking.amenityId),
        getResidentById(booking.residentId),
        getInspectionReport(booking.id),
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

      return {
        id: booking.id,
        resourceId: booking.amenityId,
        title: isJanitorial
          ? `${amenity?.name ?? 'Unknown'} setup / inspection`
          : `${titlePrefix}${amenity?.name ?? 'Unknown'} - ${resident?.name ?? 'Unknown'} (Unit ${resident?.unitNumber ?? '?'})`,
        start: booking.startDatetime instanceof Date ? booking.startDatetime.toISOString() : booking.startDatetime,
        end: booking.endDatetime instanceof Date ? booking.endDatetime.toISOString() : booking.endDatetime,
        color: isWaitlisted
          ? WAITLISTED_COLOR
          : isEarlyStage
            ? '#9CA3AF'
            : isPending
              ? PENDING_COLOR
              : isPaymentPending
                ? '#8B5CF6'
                : colorMap.get(booking.amenityId)!,
        editable: false,
        extendedProps: {
          type: 'booking' as const,
          amenityId: booking.amenityId,
          amenityName: amenity?.name ?? 'Unknown',
          residentName: resident?.name ?? 'Unknown',
          residentEmail: resident?.email ?? '',
          unitNumber: resident?.unitNumber ?? '',
          guestCount: booking.guestCount,
          status: booking.status,
          inspectionStatus: inspection?.status ?? null,
          inspectionNeeded,
        },
      }
    }),
  )

  // For janitorial view, also include turn windows as calendar events
  let turnWindowEvents: Array<{
    id: string
    resourceId: string
    title: string
    start: string
    end: string
    color: string
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

      return {
        id: `tw-${tw.id}`,
        resourceId: tw.amenityId,
        title: isJanitorial ? `Turn: ${tw.amenityName}` : `Cleaning - ${tw.amenityName}`,
        start: start instanceof Date ? start.toISOString() : String(start),
        end: end instanceof Date ? end.toISOString() : String(end),
        color: isJanitorial
          ? (TURN_WINDOW_COLORS[tw.status] ?? TURN_WINDOW_COLORS.PENDING)
          : tw.status === 'COMPLETED' ? '#D4D4D8' : '#A1A1AA',
        editable: isJanitorial && tw.status !== 'COMPLETED',
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

  const events = [...bookingEvents, ...turnWindowEvents]

  return NextResponse.json({ events, resources })
}
