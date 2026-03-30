import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/client'
import { requireRole } from '@/lib/auth'

const AmenitySchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  capacity: z.number().int().positive(),
  rentalFee: z.number().min(0),
  depositAmount: z.number().min(0),
  calendarId: z.string().min(1),
  requiresApproval: z.boolean(),
  autoApproveThreshold: z.number().int().positive().nullable().optional(),
  approverStaffId: z.string().nullable().optional(),
  escalationHours: z.number().int().positive(),
  fullRefundHours: z.number().int().min(0),
  partialRefundHours: z.number().int().min(0),
  partialRefundPercent: z.number().int().min(0).max(100),
  maxAdvanceBookingDays: z.number().int().positive(),
  janitorialAssignment: z.enum(['rotation', 'manual']),
})

function serializeAmenity(amenity: Awaited<ReturnType<typeof prisma.amenity.findFirstOrThrow>>) {
  return {
    ...amenity,
    rentalFee: Number(amenity.rentalFee),
    depositAmount: Number(amenity.depositAmount),
  }
}

export async function GET() {
  const authState = await requireRole(['property_manager', 'board'])
  if (!authState.ok) {
    return authState.response
  }

  const amenities = await prisma.amenity.findMany({
    include: {
      approverStaff: {
        select: { id: true, name: true, email: true },
      },
      blackoutDates: {
        orderBy: { startDate: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({
    amenities: amenities.map((amenity) => ({
      ...serializeAmenity(amenity),
      blackoutDates: amenity.blackoutDates.map((blackout) => ({
        ...blackout,
        startDate: blackout.startDate.toISOString(),
        endDate: blackout.endDate.toISOString(),
      })),
    })),
  })
}

export async function POST(req: NextRequest) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const body = await req.json().catch(() => null)
  const parsed = AmenitySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid amenity payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const amenity = await prisma.amenity.create({
    data: {
      ...parsed.data,
      description: parsed.data.description ?? null,
      autoApproveThreshold: parsed.data.autoApproveThreshold ?? null,
      approverStaffId: parsed.data.approverStaffId ?? null,
    },
    include: {
      approverStaff: {
        select: { id: true, name: true, email: true },
      },
      blackoutDates: true,
    },
  })

  return NextResponse.json(
    {
      amenity: {
        ...serializeAmenity(amenity),
        blackoutDates: [],
      },
    },
    { status: 201 },
  )
}
