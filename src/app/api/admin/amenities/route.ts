import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import {
  getAllAmenities,
  getBlackoutDates,
  createAmenity,
  addAuditLog,
} from '@/lib/firebase/db'

const AmenitySchema = z.object({
  name: z.string().min(2),
  description: z.string().nullable().optional(),
  capacity: z.number().int().positive(),
  rentalFee: z.number().min(0),
  depositAmount: z.number().min(0),
  requiresApproval: z.boolean(),
  autoApproveThreshold: z.number().int().positive().nullable().optional(),
  approverStaffId: z.string().nullable().optional(),
  escalationHours: z.number().int().positive(),
  fullRefundHours: z.number().int().min(0),
  partialRefundHours: z.number().int().min(0),
  partialRefundPercent: z.number().int().min(0).max(100),
  maxAdvanceBookingDays: z.number().int().positive(),
  janitorialAssignment: z.enum(['rotation', 'manual', 'none']),
  defaultTurnTimeHours: z.number().int().min(0),
  parentAmenityId: z.string().nullable().optional(),
  areaId: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export async function GET() {
  const authState = await requireRole(['property_manager', 'board'])
  if (!authState.ok) {
    return authState.response
  }

  const amenities = await getAllAmenities()

  const amenitiesWithBlackouts = await Promise.all(
    amenities.map(async (amenity) => {
      const blackoutDates = await getBlackoutDates(amenity.id)
      return {
        ...amenity,
        rentalFee: Number(amenity.rentalFee),
        depositAmount: Number(amenity.depositAmount),
        blackoutDates: blackoutDates.map((blackout) => ({
          ...blackout,
          startDate: blackout.startDate instanceof Date ? blackout.startDate.toISOString() : blackout.startDate,
          endDate: blackout.endDate instanceof Date ? blackout.endDate.toISOString() : blackout.endDate,
        })),
      }
    }),
  )

  return NextResponse.json({ amenities: amenitiesWithBlackouts })
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

  const amenity = await createAmenity({
    ...parsed.data,
    description: parsed.data.description ?? null,
    autoApproveThreshold: parsed.data.autoApproveThreshold ?? null,
    approverStaffId: parsed.data.approverStaffId ?? null,
    areaId: parsed.data.areaId ?? null,
    sortOrder: parsed.data.sortOrder ?? 0,
  })

  await addAuditLog(amenity.id, 'admin', 'AMENITY_CREATED', {
    amenityName: parsed.data.name,
  })

  return NextResponse.json(
    {
      amenity: {
        ...amenity,
        rentalFee: Number(amenity.rentalFee),
        depositAmount: Number(amenity.depositAmount),
        blackoutDates: [],
      },
    },
    { status: 201 },
  )
}
