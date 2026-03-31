import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import {
  updateAmenity,
  deleteAmenity,
  getBlackoutDates,
  getAmenityById,
  linkAmenities,
  unlinkAmenity,
  addAuditLog,
} from '@/lib/firebase/db'

const AmenityUpdateSchema = z.object({
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
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = AmenityUpdateSchema.safeParse(body)

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

  // Handle parent-child relationship changes
  const existing = await getAmenityById(id)
  const newParentId = parsed.data.parentAmenityId ?? null
  const oldParentId = existing?.parentAmenityId ?? null

  if (newParentId !== oldParentId) {
    // Unlink from old parent
    if (oldParentId) {
      await unlinkAmenity(id)
    }
    // Link to new parent
    if (newParentId) {
      await linkAmenities(newParentId, id)
    }
  }

  await updateAmenity(id, {
    ...parsed.data,
    description: parsed.data.description ?? null,
    autoApproveThreshold: parsed.data.autoApproveThreshold ?? null,
    approverStaffId: parsed.data.approverStaffId ?? null,
    parentAmenityId: newParentId,
  })

  await addAuditLog(id, 'admin', 'AMENITY_UPDATED', {
    amenityName: parsed.data.name,
  })

  const blackoutDates = await getBlackoutDates(id)

  return NextResponse.json({
    amenity: {
      id,
      ...parsed.data,
      description: parsed.data.description ?? null,
      autoApproveThreshold: parsed.data.autoApproveThreshold ?? null,
      approverStaffId: parsed.data.approverStaffId ?? null,
      rentalFee: Number(parsed.data.rentalFee),
      depositAmount: Number(parsed.data.depositAmount),
      blackoutDates: blackoutDates.map((blackout) => ({
        ...blackout,
        startDate: blackout.startDate instanceof Date ? blackout.startDate.toISOString() : blackout.startDate,
        endDate: blackout.endDate instanceof Date ? blackout.endDate.toISOString() : blackout.endDate,
      })),
    },
  })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const { id } = await params

  await deleteAmenity(id)

  await addAuditLog(id, 'admin', 'AMENITY_DELETED')

  return NextResponse.json({ success: true })
}
