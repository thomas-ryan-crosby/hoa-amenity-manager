import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import {
  getResidentById,
  getAllResidents,
  createBookingWithAuditLog,
} from '@/lib/firebase/db'
import * as orchestrator from '@/lib/agents/orchestrator'

const AdminBookingSchema = z.object({
  amenityId: z.string().min(1),
  startDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  endDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  guestCount: z.number().int().positive(),
  notes: z.string().optional(),
  // Book on behalf
  residentId: z.string().optional(),       // link to existing resident
  bookedByName: z.string().optional(),     // OR enter a generic name
  // Options
  feeWaived: z.boolean().optional(),
  anonymous: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const body = await req.json().catch(() => null)
  const parsed = AdminBookingSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { amenityId, startDatetime, endDatetime, guestCount, notes, residentId, bookedByName, feeWaived, anonymous } = parsed.data

  // Determine the resident
  let actualResidentId = residentId ?? ''
  if (residentId) {
    const resident = await getResidentById(residentId)
    if (!resident) {
      return NextResponse.json({ error: 'Selected resident not found' }, { status: 404 })
    }
    actualResidentId = resident.id
  } else if (!bookedByName) {
    return NextResponse.json({ error: 'Provide either a resident or a name' }, { status: 400 })
  }

  const booking = await createBookingWithAuditLog(
    {
      residentId: actualResidentId,
      amenityId,
      status: 'INQUIRY_RECEIVED',
      startDatetime: new Date(startDatetime),
      endDatetime: new Date(endDatetime),
      guestCount,
      notes: notes ?? null,
      bookedByName: bookedByName ?? null,
      bookedByStaffId: authState.userId,
      feeWaived: feeWaived ?? false,
      anonymous: anonymous ?? false,
    },
    'admin',
    'BOOKING_CREATED_BY_PM',
  )

  orchestrator.handleNewBooking(booking.id).catch((err) => {
    console.error(`[Orchestrator] Error handling PM booking ${booking.id}:`, err)
  })

  return NextResponse.json({ bookingId: booking.id, status: booking.status }, { status: 201 })
}
