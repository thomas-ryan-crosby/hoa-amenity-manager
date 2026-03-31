import { getBookingWithRelations } from '@/lib/firebase/db'
import { formatCurrency, formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'

async function getBooking(bookingId: string) {
  const { booking, amenity, resident } = await getBookingWithRelations(bookingId)
  return { ...booking, amenity, resident }
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

export async function notifyUnavailable(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `Requested time unavailable for ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>The time you requested for ${booking.amenity.name} is no longer available.</p>
      <p>Please try another date or time in the booking portal.</p>
      ${bookingSummaryHtml(booking)}
    `,
  })
}

export async function notifyDenied(bookingId: string, reason: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `Booking request denied for ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking request for ${booking.amenity.name} was denied.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you have questions, please contact the HOA office.</p>
      ${bookingSummaryHtml(booking)}
    `,
  })
}

export async function notifyWaitlisted(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `You're on the waitlist for ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>The time slot you requested for ${booking.amenity.name} already has an active booking.
         Your request has been placed on the <strong>waitlist</strong>.</p>
      <p>If the earlier booking is cancelled, you will be automatically promoted and notified.</p>
      ${bookingSummaryHtml(booking)}
    `,
  })
}

export async function notifyPromotedFromWaitlist(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `Great news! Your waitlisted booking for ${booking.amenity.name} is now active`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>A slot opened up for ${booking.amenity.name} and your waitlisted booking has been
         promoted. Your request is now being processed.</p>
      ${bookingSummaryHtml(booking)}
      <p>You will receive further instructions shortly.</p>
    `,
  })
}

export async function sendPaymentLink(bookingId: string, paymentUrl: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `Complete payment for ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking request is ready for payment.</p>
      ${bookingSummaryHtml(booking)}
      <p><a href="${paymentUrl}" style="background: #059669; color: white; padding: 10px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600;">Pay now to confirm</a></p>
    `,
  })
}

export async function nudgePayment(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `Payment still pending for ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking is still waiting on payment. Once payment is complete, your reservation will be confirmed.</p>
      ${bookingSummaryHtml(booking)}
    `,
  })
}

export async function sendConfirmation(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `Booking confirmed for ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking is confirmed! We look forward to hosting your event.</p>
      ${bookingSummaryHtml(booking)}
    `,
  })
}

export async function send48hrReminder(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `48-hour reminder: ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>This is your 48-hour reminder for your upcoming amenity reservation.</p>
      ${bookingSummaryHtml(booking)}
      <p>Please review community rules and leave the space in great condition after your event.</p>
    `,
  })
}

export async function sendPostEventFollowUp(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendEmail({
    to: booking.resident.email,
    subject: `Thanks for using ${booking.amenity.name}`,
    html: `
      <p>Hi ${booking.resident.name},</p>
      <p>Thanks for using ${booking.amenity.name}. We hope the event went well!</p>
      <p>Please share feedback with the HOA team when you have a moment.</p>
    `,
  })
}
