import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

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

  const statusFilter = isJanitorial
    ? { in: ['CONFIRMED' as const, 'COMPLETED' as const, 'DISPUTE' as const] }
    : isAdmin
      ? { in: ['CONFIRMED' as const, 'PENDING_APPROVAL' as const] }
      : 'CONFIRMED' as const

  const [amenities, bookings] = await Promise.all([
    prisma.amenity.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.booking.findMany({
      where: { status: statusFilter },
      include: {
        amenity: { select: { id: true, name: true } },
        resident: {
          select: { name: true, unitNumber: true, email: true },
        },
        inspectionReport: {
          select: { status: true, submittedAt: true },
        },
      },
      orderBy: { startDatetime: 'asc' },
    }),
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

  const events = bookings.map((booking) => {
    const isPending = booking.status === 'PENDING_APPROVAL'
    const inspectionNeeded =
      booking.status === 'CONFIRMED' &&
      booking.endDatetime.getTime() < Date.now() &&
      !booking.inspectionReport

    return {
      id: booking.id,
      resourceId: booking.amenityId,
      title: isJanitorial
        ? `${booking.amenity.name} setup / inspection`
        : `${booking.amenity.name} - ${booking.resident.name} (Unit ${booking.resident.unitNumber})`,
      start: booking.startDatetime.toISOString(),
      end: booking.endDatetime.toISOString(),
      color: isPending ? PENDING_COLOR : colorMap.get(booking.amenityId)!,
      extendedProps: {
        amenityId: booking.amenityId,
        amenityName: booking.amenity.name,
        residentName: booking.resident.name,
        residentEmail: booking.resident.email,
        unitNumber: booking.resident.unitNumber,
        guestCount: booking.guestCount,
        status: booking.status,
        inspectionStatus: booking.inspectionReport?.status ?? null,
        inspectionNeeded,
      },
    }
  })

  return NextResponse.json({ events, resources })
}
