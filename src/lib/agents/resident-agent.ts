import { getBookingWithRelations } from '@/lib/firebase/db'
import { formatCurrency, formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'

async function getBooking(bookingId: string) {
  const { booking, amenity, resident } = await getBookingWithRelations(bookingId)
  return { ...booking, amenity, resident }
}

/** Send email to resident + bookee if sendCommsToBookee is enabled */
async function sendToRecipients(
  booking: Awaited<ReturnType<typeof getBooking>>,
  subject: string,
  html: string,
) {
  // Always send to the resident (if they have an email)
  if (booking.resident?.email) {
    await sendEmail({ to: booking.resident.email, subject, html })
  }
  // Also send to the bookee if they have an email and comms are enabled
  if (booking.sendCommsToBookee && booking.bookedByEmail) {
    await sendEmail({ to: booking.bookedByEmail, subject, html })
  }
}

function bookingSummaryHtml(booking: Awaited<ReturnType<typeof getBooking>>) {
  return `
    <ul style="padding-left: 18px; line-height: 1.6;">
      <li><strong>Amenity:</strong> ${booking.amenity.name}</li>
      <li><strong>When:</strong> ${formatDateRange(booking.startDatetime, booking.endDatetime)}</li>
      <li><strong>Guests:</strong> ${booking.guestCount}</li>
      <li><strong>Rental fee:</strong> ${formatCurrency(booking.amenity.rentalFee)}</li>
      <li><strong>Deposit:</strong> ${formatCurrency(booking.amenity.depositAmount)}</li>
    </ul>
  `
}

export async function notifyBookingReceived(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Booking request received for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>We've received your booking request for <strong>${booking.amenity.name}</strong>. We'll notify you once it's been reviewed.</p>
      ${bookingSummaryHtml(booking)}
      <p style="color: #78716c; font-size: 13px;">You can check the status of your booking anytime in the booking portal.</p>
    `,
  )
}

export async function notifyBookingReceivedMultiple(bookingId: string, amenityNames: string[]): Promise<void> {
  const booking = await getBooking(bookingId)
  const amenityList = amenityNames.map((n) => `<li><strong>${n}</strong></li>`).join('')
  await sendToRecipients(booking,
    `Booking request received for ${amenityNames.join(' + ')}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>We've received your booking request for the following amenities:</p>
      <ul style="padding-left: 18px; line-height: 1.8;">${amenityList}</ul>
      <p><strong>When:</strong> ${formatDateRange(booking.startDatetime, booking.endDatetime)}</p>
      <p><strong>Guests:</strong> ${booking.guestCount}</p>
      <p>Each amenity will be processed separately. You'll receive updates as they are reviewed and confirmed.</p>
      <p style="color: #78716c; font-size: 13px;">You can check the status of your bookings anytime in the booking portal.</p>
    `,
  )
}

export async function notifyCancelled(bookingId: string, reason?: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Booking cancelled for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking for <strong>${booking.amenity.name}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      ${bookingSummaryHtml(booking)}
      <p>Any applicable refund will be processed per the cancellation policy.</p>
    `,
  )
}

export async function notifyUnavailable(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Requested time unavailable for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>The time you requested for ${booking.amenity.name} is no longer available.</p>
      <p>Please try another date or time in the booking portal.</p>
      ${bookingSummaryHtml(booking)}
    `,
  )
}

export async function notifyDenied(bookingId: string, reason: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Booking request denied for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking request for ${booking.amenity.name} was denied.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you have questions, please contact the HOA office.</p>
      ${bookingSummaryHtml(booking)}
    `,
  )
}

export async function notifyWaitlisted(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `You're on the waitlist for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>The time slot you requested for ${booking.amenity.name} already has an active booking.
         Your request has been placed on the <strong>waitlist</strong>.</p>
      <p>If the earlier booking is cancelled, you will be automatically promoted and notified.</p>
      ${bookingSummaryHtml(booking)}
    `,
  )
}

export async function notifyPromotedFromWaitlist(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Great news! Your waitlisted booking for ${booking.amenity.name} is now active`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>A slot opened up for ${booking.amenity.name} and your waitlisted booking has been
         promoted. Your request is now being processed.</p>
      ${bookingSummaryHtml(booking)}
      <p>You will receive further instructions shortly.</p>
    `,
  )
}

export async function sendPaymentLink(bookingId: string, paymentUrl: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Complete payment for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking request is ready for payment.</p>
      ${bookingSummaryHtml(booking)}
      <p><a href="${paymentUrl}" style="background: #059669; color: white; padding: 10px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600;">Pay now to confirm</a></p>
    `,
  )
}

export async function nudgePayment(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Payment still pending for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking is still waiting on payment. Once payment is complete, your reservation will be confirmed.</p>
      ${bookingSummaryHtml(booking)}
    `,
  )
}

export async function sendConfirmation(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Booking confirmed for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking is confirmed! We look forward to hosting your event.</p>
      ${bookingSummaryHtml(booking)}
    `,
  )
}

export async function send48hrReminder(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `48-hour reminder: ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>This is your 48-hour reminder for your upcoming amenity reservation.</p>
      ${bookingSummaryHtml(booking)}
      <p>Please review community rules and leave the space in great condition after your event.</p>
    `,
  )
}

export async function sendAccessInstructions(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  if (!booking.amenity.hasAccessInstructions || !booking.amenity.accessInstructions) return
  await sendToRecipients(booking,
    `Access instructions for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking for <strong>${booking.amenity.name}</strong> is coming up in 1 hour. Here are your access instructions:</p>
      <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <pre style="white-space: pre-wrap; font-family: sans-serif; color: #1c1917; margin: 0;">${booking.amenity.accessInstructions}</pre>
      </div>
      ${bookingSummaryHtml(booking)}
    `,
  )
}

export async function sendPostEventFollowUp(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendToRecipients(booking, `Thanks for using ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Thanks for using ${booking.amenity.name}. We hope the event went well!</p>
      <p>Please share feedback with the HOA team when you have a moment.</p>
    `,
  )
}
