import {
  getBookingById,
  getBookingWithRelations,
  transitionBookingStatus,
  hasBlackoutConflict,
  getWaitlistedBookingsForSlot,
  createTurnWindow,
} from '@/lib/firebase/db'
import { getConflictingBookings } from '@/lib/integrations/google-calendar'
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
// handleNewBooking
// ---------------------------------------------------------------------------
export async function handleNewBooking(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Handling new booking: ${bookingId}`)

  const { booking, amenity, resident } = await getBookingWithRelations(bookingId)

  await transitionBookingStatus(bookingId, 'AVAILABILITY_CHECKING', 'orchestrator', {
    from: 'INQUIRY_RECEIVED',
    to: 'AVAILABILITY_CHECKING',
  })

  // 1. Check maxAdvanceBookingDays
  const now = new Date()
  const daysUntilBooking = Math.ceil(
    (booking.startDatetime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (daysUntilBooking > amenity.maxAdvanceBookingDays) {
    await transitionBookingStatus(bookingId, 'DENIED', 'orchestrator', {
      event: 'ADVANCE_BOOKING_EXCEEDED',
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
  const isBlackedOut = await hasBlackoutConflict(
    amenity.id,
    booking.startDatetime,
    booking.endDatetime,
  )
  if (isBlackedOut) {
    await transitionBookingStatus(bookingId, 'DENIED', 'orchestrator', {
      event: 'BLACKOUT_CONFLICT',
    })
    await residentAgent.notifyDenied(
      bookingId,
      'The requested dates overlap with a blackout period.',
    )
    return
  }

  // 3. Check for conflicting bookings — waitlist if slot is taken
  const conflicts = await getConflictingBookings(
    amenity.id,
    booking.startDatetime,
    booking.endDatetime,
    bookingId,
  )

  if (conflicts.length > 0) {
    await transitionBookingStatus(bookingId, 'WAITLISTED', 'orchestrator', {
      event: 'SLOT_OCCUPIED_WAITLISTED',
      conflictCount: conflicts.length,
      conflictIds: conflicts.map((c) => c.id),
    })
    // Notify resident they're on the waitlist
    residentAgent.notifyWaitlisted(bookingId).catch((err) => {
      console.error(`[Orchestrator] Failed to notify waitlist for ${bookingId}:`, err)
    })
    return
  }

  // 4. Create turn window immediately if the amenity requires janitorial turnaround
  if (amenity.defaultTurnTimeHours > 0) {
    await createTurnWindow({
      bookingId,
      amenityId: amenity.id,
      staffId: null,
      defaultStart: booking.endDatetime,
      defaultEnd: new Date(booking.endDatetime.getTime() + amenity.defaultTurnTimeHours * 60 * 60 * 1000),
      actualStart: null,
      actualEnd: null,
      status: 'PENDING',
      completedAt: null,
    })
  }

  // 5. Determine approval routing
  const needsApproval =
    amenity.requiresApproval &&
    (amenity.autoApproveThreshold === null ||
      booking.guestCount > amenity.autoApproveThreshold)

  const isFreeAmenity = amenity.rentalFee === 0 && amenity.depositAmount === 0

  if (needsApproval) {
    await transitionBookingStatus(bookingId, 'PENDING_APPROVAL', 'orchestrator', {
      event: 'APPROVAL_REQUIRED',
      guestCount: booking.guestCount,
    })
    pmAgent.sendApprovalRequest(bookingId).catch((err) => {
      console.error(`[Orchestrator] Failed to send approval request for ${bookingId}:`, err)
    })
  } else if (isFreeAmenity) {
    // Free amenity, no approval needed — confirm immediately
    await transitionBookingStatus(bookingId, 'CONFIRMED', 'orchestrator', {
      event: 'AUTO_CONFIRMED_FREE',
      guestCount: booking.guestCount,
    })
    await scheduleReminder(bookingId, booking.startDatetime)
    await schedulePostEventFollowup(bookingId, booking.endDatetime)
    residentAgent.sendConfirmation(bookingId).catch((err) => {
      console.error(`[Orchestrator] Failed to send confirmation for ${bookingId}:`, err)
    })
  } else {
    await transitionBookingStatus(bookingId, 'PAYMENT_PENDING', 'orchestrator', {
      event: 'AUTO_APPROVED',
      guestCount: booking.guestCount,
    })

    try {
      const customerId = await getOrCreateCustomer({
        id: resident.id,
        email: resident.email,
        name: resident.name,
        stripeCustomerId: resident.stripeCustomerId,
      })
      const paymentUrl = await createPaymentLink(
        bookingId,
        amenity.rentalFee,
        amenity.depositAmount,
        customerId,
      )
      await residentAgent.sendPaymentLink(bookingId, paymentUrl)
    } catch (err) {
      console.error(`[Orchestrator] Stripe/payment link failed for ${bookingId}:`, err)
    }
  }
}

// ---------------------------------------------------------------------------
// handleApproval
// ---------------------------------------------------------------------------
export async function handleApproval(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Handling approval: ${bookingId}`)

  const { booking, amenity, resident } = await getBookingWithRelations(bookingId)
  const isFreeAmenity = amenity.rentalFee === 0 && amenity.depositAmount === 0

  if (isFreeAmenity) {
    // Free amenity — confirm immediately after approval
    await transitionBookingStatus(bookingId, 'CONFIRMED', 'orchestrator', {
      event: 'APPROVED_AND_CONFIRMED_FREE',
      from: booking.status,
    })
    await scheduleReminder(bookingId, booking.startDatetime)
    await schedulePostEventFollowup(bookingId, booking.endDatetime)
    residentAgent.sendConfirmation(bookingId).catch((err) => {
      console.error(`[Orchestrator] Failed to send confirmation for ${bookingId}:`, err)
    })
  } else {
    await transitionBookingStatus(bookingId, 'PAYMENT_PENDING', 'orchestrator', {
      event: 'APPROVED_BY_PM',
      from: booking.status,
    })

    try {
      const customerId = await getOrCreateCustomer({
        id: resident.id,
        email: resident.email,
        name: resident.name,
        stripeCustomerId: resident.stripeCustomerId,
      })
      const paymentUrl = await createPaymentLink(
        bookingId,
        amenity.rentalFee,
        amenity.depositAmount,
        customerId,
      )
      await residentAgent.sendPaymentLink(bookingId, paymentUrl)
    } catch (err) {
      console.error(`[Orchestrator] Stripe/payment failed for ${bookingId}:`, err)
    }
  }
}

// ---------------------------------------------------------------------------
// handleDenial
// ---------------------------------------------------------------------------
export async function handleDenial(
  bookingId: string,
  reason: string,
): Promise<void> {
  console.log(`[Orchestrator] Handling denial: ${bookingId}`)

  const { booking } = await getBookingWithRelations(bookingId)

  await transitionBookingStatus(bookingId, 'DENIED', 'orchestrator', {
    event: 'DENIED_BY_PM',
    reason,
    from: booking.status,
  })

  await residentAgent.notifyDenied(bookingId, reason)
}

// ---------------------------------------------------------------------------
// handlePaymentSuccess
// ---------------------------------------------------------------------------
export async function handlePaymentSuccess(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Payment success: ${bookingId}`)

  const { booking, amenity } = await getBookingWithRelations(bookingId)

  await transitionBookingStatus(bookingId, 'CONFIRMED', 'orchestrator', {
    event: 'PAYMENT_RECEIVED',
    from: booking.status,
  })

  await scheduleReminder(bookingId, booking.startDatetime)
  await schedulePostEventFollowup(bookingId, booking.endDatetime)
  await residentAgent.sendConfirmation(bookingId)
}

// ---------------------------------------------------------------------------
// handlePaymentFailed
// ---------------------------------------------------------------------------
export async function handlePaymentFailed(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Payment failed: ${bookingId}`)
  await transitionBookingStatus(bookingId, 'PAYMENT_FAILED', 'orchestrator', {
    event: 'PAYMENT_FAILED',
  })
  await residentAgent.nudgePayment(bookingId)
}

// ---------------------------------------------------------------------------
// handleCancellation
// ---------------------------------------------------------------------------
export async function handleCancellation(bookingId: string): Promise<void> {
  console.log(`[Orchestrator] Cancellation: ${bookingId}`)

  const { booking, amenity } = await getBookingWithRelations(bookingId)

  const now = new Date()
  const hoursUntilStart = Math.max(
    0,
    (booking.startDatetime.getTime() - now.getTime()) / (1000 * 60 * 60),
  )

  let refundPercent = 0
  let refundReason = ''

  if (hoursUntilStart >= amenity.fullRefundHours) {
    refundPercent = 100
    refundReason = `Full refund: cancelled ${Math.floor(hoursUntilStart)}h before event`
  } else if (hoursUntilStart >= amenity.partialRefundHours) {
    refundPercent = amenity.partialRefundPercent
    refundReason = `Partial refund (${amenity.partialRefundPercent}%): cancelled ${Math.floor(hoursUntilStart)}h before event`
  } else {
    refundReason = `No refund: cancelled ${Math.floor(hoursUntilStart)}h before event`
  }

  if (refundPercent > 0 && booking.stripePaymentIntentId) {
    const refundAmount = Math.round((amenity.rentalFee * refundPercent) / 100)
    try {
      await issueRefund(booking.stripePaymentIntentId, refundAmount)
    } catch (err) {
      console.error(`[Orchestrator] Failed to issue refund for ${bookingId}:`, err)
    }
  }

  await transitionBookingStatus(bookingId, 'CANCELLED', 'orchestrator', {
    event: 'BOOKING_CANCELLED',
    refundPercent,
    refundReason,
  })

  // Notify resident of cancellation
  residentAgent.notifyCancelled(bookingId, refundReason).catch((err) => {
    console.error(`[Orchestrator] Cancellation email failed for ${bookingId}:`, err)
  })

  // Promote the next waitlisted booking for this slot
  await promoteNextWaitlisted(
    booking.amenityId,
    booking.startDatetime,
    booking.endDatetime,
  )
}

// ---------------------------------------------------------------------------
// promoteNextWaitlisted — after a cancellation, check if a waitlisted booking
// can be promoted
// ---------------------------------------------------------------------------
async function promoteNextWaitlisted(
  amenityId: string,
  start: Date,
  end: Date,
): Promise<void> {
  const waitlisted = await getWaitlistedBookingsForSlot(amenityId, start, end)
  if (waitlisted.length === 0) return

  const next = waitlisted[0]
  console.log(`[Orchestrator] Promoting waitlisted booking ${next.id}`)

  await transitionBookingStatus(next.id, 'INQUIRY_RECEIVED', 'orchestrator', {
    event: 'PROMOTED_FROM_WAITLIST',
  })

  // Notify the resident their waitlisted booking has been promoted
  residentAgent.notifyPromotedFromWaitlist(next.id).catch((err) => {
    console.error(`[Orchestrator] Failed to notify promotion for ${next.id}:`, err)
  })

  // Re-run the orchestrator for the promoted booking
  handleNewBooking(next.id).catch((err) => {
    console.error(`[Orchestrator] Error handling promoted booking ${next.id}:`, err)
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

  const booking = await getBookingById(bookingId)
  if (!booking) throw new Error(`Booking ${bookingId} not found`)

  if (status === 'PASS') {
    if (booking.stripeDepositIntentId) {
      try {
        await issueRefund(booking.stripeDepositIntentId)
      } catch (err) {
        console.error(`[Orchestrator] Failed to release deposit for ${bookingId}:`, err)
      }
    }
    await transitionBookingStatus(bookingId, 'CLOSED', 'orchestrator', {
      event: 'INSPECTION_PASSED',
      depositReleased: !!booking.stripeDepositIntentId,
    })
  } else {
    await transitionBookingStatus(bookingId, 'DISPUTE', 'orchestrator', {
      event: 'INSPECTION_FLAGGED',
    })
  }
}
