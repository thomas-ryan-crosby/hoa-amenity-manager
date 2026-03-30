import { BookingStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/db/client'
import {
  checkAvailability,
  createHold,
  confirmEvent,
  deleteEvent,
} from '@/lib/integrations/google-calendar'
import {
  createPaymentLink,
  getOrCreateCustomer,
  issueRefund,
} from '@/lib/integrations/stripe'
import * as residentAgent from '@/lib/agents/resident-agent'
import * as pmAgent from '@/lib/agents/pm-agent'
import {
  scheduleReminder,
  schedulePostEventFollowup,
} from '@/lib/queue/reminder-jobs'

// ---------------------------------------------------------------------------
// Helper: transition status + write audit log in one transaction
// ---------------------------------------------------------------------------
async function transitionStatus(
  bookingId: string,
  newStatus: BookingStatus,
  event: string,
  payload?: Prisma.InputJsonValue,
) {
  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: newStatus },
    })
    await tx.auditLog.create({
      data: {
        bookingId,
        agent: 'orchestrator',
        event,
        payload: payload ?? Prisma.JsonNull,
      },
    })
  })
}

// ---------------------------------------------------------------------------
// handleNewBooking
// ---------------------------------------------------------------------------
export async function handleNewBooking(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Handling new booking: ${bookingId}`)

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { amenity: true, resident: true },
  })
  const { amenity } = booking

  // Transition to AVAILABILITY_CHECKING
  await transitionStatus(bookingId, 'AVAILABILITY_CHECKING', 'STATUS_CHANGE', {
    from: 'INQUIRY_RECEIVED',
    to: 'AVAILABILITY_CHECKING',
  })

  // 1. Check maxAdvanceBookingDays
  const now = new Date()
  const daysUntilBooking = Math.ceil(
    (booking.startDatetime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (daysUntilBooking > amenity.maxAdvanceBookingDays) {
    await transitionStatus(bookingId, 'DENIED', 'ADVANCE_BOOKING_EXCEEDED', {
      daysUntilBooking,
      maxAdvanceBookingDays: amenity.maxAdvanceBookingDays,
    })
    await residentAgent.notifyDenied(
      bookingId,
      `Bookings for ${amenity.name} can only be made up to ${amenity.maxAdvanceBookingDays} days in advance.`,
    )
    return
  }

  // 2. Check blackout dates
  const blackoutConflict = await prisma.blackoutDate.findFirst({
    where: {
      amenityId: amenity.id,
      startDate: { lte: booking.endDatetime },
      endDate: { gte: booking.startDatetime },
    },
  })
  if (blackoutConflict) {
    await transitionStatus(bookingId, 'DENIED', 'BLACKOUT_CONFLICT', {
      blackoutDateId: blackoutConflict.id,
      reason: blackoutConflict.reason,
    })
    await residentAgent.notifyDenied(
      bookingId,
      `The requested dates overlap with a blackout period${blackoutConflict.reason ? ': ' + blackoutConflict.reason : ''}.`,
    )
    return
  }

  // 3. Check Google Calendar availability
  let isAvailable: boolean
  try {
    isAvailable = await checkAvailability(
      amenity.calendarId,
      booking.startDatetime,
      booking.endDatetime,
    )
  } catch (err) {
    console.error(`[Orchestrator] Calendar check failed for ${bookingId}:`, err)
    await transitionStatus(bookingId, 'ERROR', 'CALENDAR_CHECK_FAILED', {
      error: err instanceof Error ? err.message : String(err),
    })
    return
  }

  if (!isAvailable) {
    await transitionStatus(bookingId, 'DENIED', 'CALENDAR_CONFLICT', {
      reason: 'Time slot is already booked.',
    })
    await residentAgent.notifyUnavailable(bookingId)
    return
  }

  // 4. Create a tentative hold on the calendar
  let eventId: string
  try {
    eventId = await createHold(
      amenity.calendarId,
      bookingId,
      booking.startDatetime,
      booking.endDatetime,
    )
  } catch (err) {
    console.error(`[Orchestrator] Failed to create hold for ${bookingId}:`, err)
    await transitionStatus(bookingId, 'ERROR', 'HOLD_CREATION_FAILED', {
      error: err instanceof Error ? err.message : String(err),
    })
    return
  }

  // Store the calendar event ID on the booking
  await prisma.booking.update({
    where: { id: bookingId },
    data: { calendarEventId: eventId },
  })

  // 5. Determine approval routing
  const needsApproval =
    amenity.requiresApproval &&
    (amenity.autoApproveThreshold === null ||
      booking.guestCount > amenity.autoApproveThreshold)

  if (needsApproval) {
    await transitionStatus(bookingId, 'PENDING_APPROVAL', 'APPROVAL_REQUIRED', {
      requiresApproval: amenity.requiresApproval,
      autoApproveThreshold: amenity.autoApproveThreshold,
      guestCount: booking.guestCount,
    })
    await pmAgent.sendApprovalRequest(bookingId)
  } else {
    // Auto-approved — go straight to payment
    await transitionStatus(bookingId, 'PAYMENT_PENDING', 'AUTO_APPROVED', {
      autoApproveThreshold: amenity.autoApproveThreshold,
      guestCount: booking.guestCount,
    })

    // Generate payment link and notify resident
    const customerId = await getOrCreateCustomer(booking.resident)
    const paymentUrl = await createPaymentLink(
      bookingId,
      Number(amenity.rentalFee),
      Number(amenity.depositAmount),
      customerId,
    )
    await residentAgent.sendPaymentLink(bookingId, paymentUrl)
  }
}

// ---------------------------------------------------------------------------
// handleApproval
// ---------------------------------------------------------------------------
export async function handleApproval(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Handling approval: ${bookingId}`)

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { amenity: true, resident: true },
  })

  await transitionStatus(bookingId, 'PAYMENT_PENDING', 'APPROVED_BY_PM', {
    from: booking.status,
    to: 'PAYMENT_PENDING',
  })

  const customerId = await getOrCreateCustomer(booking.resident)
  const paymentUrl = await createPaymentLink(
    bookingId,
    Number(booking.amenity.rentalFee),
    Number(booking.amenity.depositAmount),
    customerId,
  )

  await residentAgent.sendPaymentLink(bookingId, paymentUrl)
}

// ---------------------------------------------------------------------------
// handleDenial
// ---------------------------------------------------------------------------
export async function handleDenial(
  bookingId: string,
  reason: string,
): Promise<void> {
  console.log(`[Orchestrator] Handling denial: ${bookingId}`)

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { amenity: true },
  })

  await transitionStatus(bookingId, 'DENIED', 'DENIED_BY_PM', {
    reason,
    from: booking.status,
  })

  // Remove calendar hold if one exists
  if (booking.calendarEventId) {
    try {
      await deleteEvent(booking.amenity.calendarId, booking.calendarEventId)
    } catch (err) {
      console.error(
        `[Orchestrator] Failed to delete calendar hold for ${bookingId}:`,
        err,
      )
    }
    await prisma.booking.update({
      where: { id: bookingId },
      data: { calendarEventId: null },
    })
  }

  await residentAgent.notifyDenied(bookingId, reason)
}

// ---------------------------------------------------------------------------
// handlePaymentSuccess
// ---------------------------------------------------------------------------
export async function handlePaymentSuccess(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Payment success: ${bookingId}`)

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { amenity: true, resident: true },
  })

  await transitionStatus(bookingId, 'CONFIRMED', 'PAYMENT_RECEIVED', {
    from: booking.status,
    to: 'CONFIRMED',
  })

  // Confirm the calendar hold as a real event
  if (booking.calendarEventId) {
    try {
      await confirmEvent(
        booking.amenity.calendarId,
        booking.calendarEventId,
        [booking.resident.email],
      )
    } catch (err) {
      console.error(
        `[Orchestrator] Failed to confirm calendar event for ${bookingId}:`,
        err,
      )
    }
  }

  // Schedule reminder and post-event follow-up jobs
  await scheduleReminder(bookingId, booking.startDatetime)
  await schedulePostEventFollowup(bookingId, booking.endDatetime)

  await residentAgent.sendConfirmation(bookingId)
}

// ---------------------------------------------------------------------------
// handlePaymentFailed
// ---------------------------------------------------------------------------
export async function handlePaymentFailed(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Payment failed: ${bookingId}`)

  await transitionStatus(bookingId, 'PAYMENT_FAILED', 'PAYMENT_FAILED', {
    to: 'PAYMENT_FAILED',
  })

  await residentAgent.nudgePayment(bookingId)
}

// ---------------------------------------------------------------------------
// handleCancellation
// ---------------------------------------------------------------------------
export async function handleCancellation(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Cancellation: ${bookingId}`)

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { amenity: true },
  })
  const { amenity } = booking

  // Calculate refund based on amenity cancellation policy
  const now = new Date()
  const hoursUntilStart = Math.max(
    0,
    (booking.startDatetime.getTime() - now.getTime()) / (1000 * 60 * 60),
  )

  let refundPercent = 0
  let refundReason = ''

  if (hoursUntilStart >= amenity.fullRefundHours) {
    refundPercent = 100
    refundReason = `Full refund: cancelled ${Math.floor(hoursUntilStart)}h before event (policy: ${amenity.fullRefundHours}h)`
  } else if (hoursUntilStart >= amenity.partialRefundHours) {
    refundPercent = amenity.partialRefundPercent
    refundReason = `Partial refund (${amenity.partialRefundPercent}%): cancelled ${Math.floor(hoursUntilStart)}h before event (policy: ${amenity.partialRefundHours}h)`
  } else {
    refundReason = `No refund: cancelled ${Math.floor(hoursUntilStart)}h before event (minimum: ${amenity.partialRefundHours}h)`
  }

  // Issue refund if applicable
  if (refundPercent > 0 && booking.stripePaymentIntentId) {
    const rentalFee = Number(amenity.rentalFee)
    const refundAmount = Math.round((rentalFee * refundPercent) / 100)
    try {
      await issueRefund(booking.stripePaymentIntentId, refundAmount)
    } catch (err) {
      console.error(
        `[Orchestrator] Failed to issue refund for ${bookingId}:`,
        err,
      )
    }
  }

  // Delete calendar event if one exists
  if (booking.calendarEventId) {
    try {
      await deleteEvent(amenity.calendarId, booking.calendarEventId)
    } catch (err) {
      console.error(
        `[Orchestrator] Failed to delete calendar event for ${bookingId}:`,
        err,
      )
    }
    await prisma.booking.update({
      where: { id: bookingId },
      data: { calendarEventId: null },
    })
  }

  await transitionStatus(bookingId, 'CANCELLED', 'BOOKING_CANCELLED', {
    refundPercent,
    refundReason,
    hoursUntilStart: Math.floor(hoursUntilStart),
  })
}

// ---------------------------------------------------------------------------
// handleInspectionComplete
// ---------------------------------------------------------------------------
export async function handleInspectionComplete(
  bookingId: string,
  status: 'PASS' | 'FLAG',
): Promise<void> {
  console.log(`[Orchestrator] Inspection complete: ${bookingId} - ${status}`)

  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
  })

  if (status === 'PASS') {
    // Release the deposit
    if (booking.stripeDepositIntentId) {
      try {
        await issueRefund(booking.stripeDepositIntentId)
      } catch (err) {
        console.error(
          `[Orchestrator] Failed to release deposit for ${bookingId}:`,
          err,
        )
      }
    }

    await transitionStatus(bookingId, 'CLOSED', 'INSPECTION_PASSED', {
      inspectionStatus: 'PASS',
      depositReleased: !!booking.stripeDepositIntentId,
    })
  } else {
    // FLAG — transition to DISPUTE
    await transitionStatus(bookingId, 'DISPUTE', 'INSPECTION_FLAGGED', {
      inspectionStatus: 'FLAG',
    })
  }
}
