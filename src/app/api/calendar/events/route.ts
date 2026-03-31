import { NextRequest, NextResponse } from 'next/server'
import {
  getAllAmenities,
  getBookingsByStatus,
  getResidentById,
  getAmenityById,
  getInspectionReport,
  type BookingStatus,
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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const isAdmin = role === 'admin'
  const isJanitorial = role === 'janitorial'

  const statuses: BookingStatus[] = isJanitorial
    ? ['CONFIRMED', 'COMPLETED', 'DISPUTE', 'IN_PROGRESS']
    : isAdmin
      ? ['INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'REMINDER_SENT']
      : ['INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING', 'PENDING_APPROVAL', 'PAYMENT_PENDING', 'CONFIRMED', 'REMINDER_SENT']

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
  const events = await Promise.all(
    bookings.map(async (booking) => {
      const [amenity, resident, inspection] = await Promise.all([
        getAmenityById(booking.amenityId),
        getResidentById(booking.residentId),
        getInspectionReport(booking.id),
      ])

      const isEarlyStage = ['INQUIRY_RECEIVED', 'AVAILABILITY_CHECKING'].includes(booking.status)
      const isPending = booking.status === 'PENDING_APPROVAL'
      const isPaymentPending = booking.status === 'PAYMENT_PENDING'
      const endTime = booking.endDatetime instanceof Date
        ? booking.endDatetime.getTime()
        : new Date(booking.endDatetime).getTime()
      const inspectionNeeded =
        booking.status === 'CONFIRMED' &&
        endTime < Date.now() &&
        !inspection

      return {
        id: booking.id,
        resourceId: booking.amenityId,
        title: isJanitorial
          ? `${amenity?.name ?? 'Unknown'} setup / inspection`
          : `${amenity?.name ?? 'Unknown'} - ${resident?.name ?? 'Unknown'} (Unit ${resident?.unitNumber ?? '?'})`,
        start: booking.startDatetime instanceof Date ? booking.startDatetime.toISOString() : booking.startDatetime,
        end: booking.endDatetime instanceof Date ? booking.endDatetime.toISOString() : booking.endDatetime,
        color: isEarlyStage ? '#9CA3AF' : isPending ? PENDING_COLOR : isPaymentPending ? '#8B5CF6' : colorMap.get(booking.amenityId)!,
        extendedProps: {
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

  return NextResponse.json({ events, resources })
}
