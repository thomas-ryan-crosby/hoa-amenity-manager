import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import {
  getResidentById,
  getAllResidents,
  createBookingWithAuditLog,
} from '@/lib/firebase/db'
import * as orchestrator from '@/lib/agents/orchestrator'
import { getActiveCommunityId } from '@/lib/community'

const AdminBookingSchema = z.object({
  amenityId: z.string().min(1),
  additionalAmenityIds: z.array(z.string()).optional(),
  startDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  endDatetime: z.string().refine((s) => !isNaN(Date.parse(s)), 'Invalid date'),
  guestCount: z.number().int().positive(),
  notes: z.string().optional(),
  // Book on behalf
  residentId: z.string().optional(),
  bookedByName: z.string().optional(),
  bookedByEmail: z.string().email().optional().or(z.literal('')),
  bookedByPhone: z.string().optional(),
  sendCommsToBookee: z.boolean().optional(),
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

  const communityId = await getActiveCommunityId()
  const { amenityId, additionalAmenityIds, startDatetime, endDatetime, guestCount, notes, residentId, bookedByName, bookedByEmail, bookedByPhone, sendCommsToBookee, feeWaived, anonymous } = parsed.data

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
      bookedByEmail: bookedByEmail || null,
      bookedByPhone: bookedByPhone || null,
      bookedByStaffId: authState.userId,
      sendCommsToBookee: sendCommsToBookee ?? false,
      feeWaived: feeWaived ?? false,
      anonymous: anonymous ?? false,
      ...(communityId ? { communityId } : {}),
    },
    'admin',
    'BOOKING_CREATED_BY_PM',
  )

  // Create additional bookings for bundled amenities
  const additionalBookingIds: string[] = []
  if (additionalAmenityIds?.length) {
    for (const addId of additionalAmenityIds) {
      const addBooking = await createBookingWithAuditLog(
        {
          residentId: actualResidentId,
          amenityId: addId,
          status: 'INQUIRY_RECEIVED',
          startDatetime: new Date(startDatetime),
          endDatetime: new Date(endDatetime),
          guestCount,
          notes: notes ? `[Bundled booking] ${notes}` : '[Bundled booking]',
          bookedByName: bookedByName ?? null,
          bookedByEmail: bookedByEmail || null,
          bookedByPhone: bookedByPhone || null,
          bookedByStaffId: authState.userId,
          sendCommsToBookee: sendCommsToBookee ?? false,
          feeWaived: feeWaived ?? false,
          anonymous: anonymous ?? false,
          ...(communityId ? { communityId } : {}),
        },
        'admin',
        'BOOKING_CREATED_BY_PM_BUNDLED',
      )
      additionalBookingIds.push(addBooking.id)
    }
  }

  // Run orchestration sequentially
  async function runOrchestration() {
    try { await orchestrator.handleNewBooking(booking.id) } catch (err) {
      console.error(`[Orchestrator] Error handling PM booking ${booking.id}:`, err)
    }
    for (const addId of additionalBookingIds) {
      try { await orchestrator.handleNewBooking(addId) } catch (err) {
        console.error(`[Orchestrator] Error handling PM booking ${addId}:`, err)
      }
    }
  }
  runOrchestration() // fire-and-forget

  return NextResponse.json({ bookingId: booking.id, additionalBookingIds, status: booking.status }, { status: 201 })
}
