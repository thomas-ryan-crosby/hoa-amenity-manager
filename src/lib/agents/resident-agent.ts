import { getBookingWithRelations } from '@/lib/firebase/db'
import { formatCurrency, formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'
import { sendSMS } from '@/lib/integrations/twilio'

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

async function sendResidentMessage(
  bookingId: string,
  subject: string,
  html: string,
  sms: string,
) {
  const booking = await getBooking(bookingId)

  await sendEmail({
    to: booking.resident.email,
    subject,
    html,
  })

  if (booking.resident.phone) {
    await sendSMS(booking.resident.phone, sms)
  }
}

export async function notifyUnavailable(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendResidentMessage(
    bookingId,
    `Requested time unavailable for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>The time you requested for ${booking.amenity.name} is no longer available.</p>
      <p>Please try another date or time in the booking portal.</p>
      ${bookingSummaryHtml(booking)}
    `,
    `${booking.amenity.name} is unavailable at that time. Please try another slot in Sanctuary Booking.`,
  )
}

export async function notifyDenied(
  bookingId: string,
  reason: string,
): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendResidentMessage(
    bookingId,
    `Booking request denied for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking request for ${booking.amenity.name} was denied.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>If you have questions, please contact the HOA office.</p>
      ${bookingSummaryHtml(booking)}
    `,
    `Your ${booking.amenity.name} request was denied. Reason: ${reason}`,
  )
}

export async function sendPaymentLink(
  bookingId: string,
  paymentUrl: string,
): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendResidentMessage(
    bookingId,
    `Complete payment for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking request is ready for payment.</p>
      ${bookingSummaryHtml(booking)}
      <p><a href="${paymentUrl}">Pay now to confirm your reservation</a></p>
    `,
    `Pay to confirm your ${booking.amenity.name} booking: ${paymentUrl}`,
  )
}

export async function nudgePayment(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendResidentMessage(
    bookingId,
    `Payment still pending for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking is still waiting on payment. Once payment is complete, your reservation will be confirmed.</p>
      ${bookingSummaryHtml(booking)}
    `,
    `Reminder: payment is still pending for your ${booking.amenity.name} booking.`,
  )
}

export async function sendConfirmation(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendResidentMessage(
    bookingId,
    `Booking confirmed for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Your booking is confirmed. We look forward to hosting your event.</p>
      ${bookingSummaryHtml(booking)}
    `,
    `Confirmed: ${booking.amenity.name} on ${formatDateRange(booking.startDatetime, booking.endDatetime)}.`,
  )
}

export async function send48hrReminder(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendResidentMessage(
    bookingId,
    `48-hour reminder for ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>This is your 48-hour reminder for your upcoming amenity reservation.</p>
      ${bookingSummaryHtml(booking)}
      <p>Please review community rules and leave the space in great condition after your event.</p>
    `,
    `Reminder: your ${booking.amenity.name} booking is coming up soon.`,
  )
}

export async function sendPostEventFollowUp(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  await sendResidentMessage(
    bookingId,
    `Thanks for using ${booking.amenity.name}`,
    `
      <p>Hi ${booking.resident.name},</p>
      <p>Thanks for using ${booking.amenity.name}. We hope the event went well.</p>
      <p>Please share feedback with the HOA team when you have a moment.</p>
    `,
    `Thanks for using ${booking.amenity.name}. We appreciate your feedback.`,
  )
}
