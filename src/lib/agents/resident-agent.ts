import { getBookingWithRelations } from '@/lib/firebase/db'
import { formatCurrency, formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'

async function getBooking(bookingId: string) {
  const { booking, amenity, resident, communityName } = await getBookingWithRelations(bookingId)
  return { ...booking, amenity, resident, communityName }
}

/** Send email to resident + bookee if sendCommsToBookee is enabled */
async function sendToRecipients(
  booking: Awaited<ReturnType<typeof getBooking>>,
  subject: string,
  html: string,
) {
  if (booking.resident?.email) {
    await sendEmail({ to: booking.resident.email, subject, html })
  }
  if (booking.sendCommsToBookee && booking.bookedByEmail) {
    await sendEmail({ to: booking.bookedByEmail, subject, html })
  }
}

function emailWrapper(communityName: string | null, content: string): string {
  const community = communityName ?? 'your community'
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
      <p style="color: #059669; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Neighbri</p>
      ${content}
      <p style="color: #a8a29e; font-size: 13px; margin-top: 32px; border-top: 1px solid #e7e5e4; padding-top: 16px;">
        ${community} &mdash; powered by <a href="https://neighbri.com" style="color: #059669; text-decoration: none;">Neighbri</a>
      </p>
    </div>
  `
}

function bookingSummaryHtml(booking: Awaited<ReturnType<typeof getBooking>>) {
  const community = booking.communityName ?? 'your community'
  return `
    <div style="margin: 16px 0; padding: 16px; background: #fafaf9; border-radius: 12px;">
      <p style="margin: 0 0 4px; color: #78716c; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Booking Details</p>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1c1917;">
        <tr><td style="padding: 4px 0; color: #78716c;">Community</td><td style="padding: 4px 0; font-weight: 600;">${community}</td></tr>
        <tr><td style="padding: 4px 0; color: #78716c;">Amenity</td><td style="padding: 4px 0; font-weight: 600;">${booking.amenity.name}</td></tr>
        <tr><td style="padding: 4px 0; color: #78716c;">When</td><td style="padding: 4px 0;">${formatDateRange(booking.startDatetime, booking.endDatetime)}</td></tr>
        <tr><td style="padding: 4px 0; color: #78716c;">Guests</td><td style="padding: 4px 0;">${booking.guestCount}</td></tr>
        ${booking.amenity.rentalFee > 0 ? `<tr><td style="padding: 4px 0; color: #78716c;">Rental fee</td><td style="padding: 4px 0;">${formatCurrency(booking.amenity.rentalFee)}</td></tr>` : ''}
        ${booking.amenity.depositAmount > 0 ? `<tr><td style="padding: 4px 0; color: #78716c;">Deposit</td><td style="padding: 4px 0;">${formatCurrency(booking.amenity.depositAmount)}</td></tr>` : ''}
      </table>
    </div>
  `
}

function accessNoticeHtml(amenity: { hasAccessInstructions?: boolean }): string {
  if (!amenity.hasAccessInstructions) return ''
  return '<p style="color: #059669; font-size: 13px; margin-top: 12px;">This amenity has access instructions (gate codes, keys, etc.) that will be sent to you <strong>1 hour before</strong> your booking starts.</p>'
}

export async function notifyBookingReceived(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Booking request received — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Booking request received</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, we've received your booking request for
        <strong>${booking.amenity.name}</strong> at <strong>${community}</strong>.
        We'll notify you once it's been reviewed.
      </p>
      ${bookingSummaryHtml(booking)}
      ${accessNoticeHtml(booking.amenity)}
      <p style="color: #78716c; font-size: 13px;">You can check your booking status anytime at <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'}/resident/bookings" style="color: #059669;">My Bookings</a>.</p>
    `),
  )
}

export async function notifyBookingReceivedMultiple(bookingId: string, amenityNames: string[]): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  const amenityList = amenityNames.map((n) => `<li><strong>${n}</strong></li>`).join('')
  await sendToRecipients(booking,
    `Booking request received — ${amenityNames.join(' + ')} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Booking request received</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, we've received your booking request for the following amenities
        at <strong>${community}</strong>:
      </p>
      <ul style="padding-left: 18px; line-height: 1.8; color: #1c1917;">${amenityList}</ul>
      <p style="color: #57534e; font-size: 15px;"><strong>When:</strong> ${formatDateRange(booking.startDatetime, booking.endDatetime)}</p>
      <p style="color: #57534e; font-size: 15px;"><strong>Guests:</strong> ${booking.guestCount}</p>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Each amenity will be processed separately. You'll receive updates as they are reviewed and confirmed.
      </p>
      ${accessNoticeHtml(booking.amenity)}
    `),
  )
}

export async function notifyCancelled(bookingId: string, reason?: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Booking cancelled — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Booking cancelled</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, your booking for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> has been cancelled.
      </p>
      ${reason ? `<p style="color: #57534e; font-size: 15px;"><strong>Reason:</strong> ${reason}</p>` : ''}
      ${bookingSummaryHtml(booking)}
      <p style="color: #57534e; font-size: 15px;">Any applicable refund will be processed per the cancellation policy.</p>
    `),
  )
}

export async function notifyUnavailable(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Time unavailable — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Time unavailable</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, the time you requested for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> is no longer available.
      </p>
      <p style="color: #57534e; font-size: 15px;">Please try another date or time in the <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'}/resident" style="color: #059669;">booking portal</a>.</p>
      ${bookingSummaryHtml(booking)}
    `),
  )
}

export async function notifyDenied(bookingId: string, reason: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Booking request denied — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Booking request denied</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, your booking request for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> was denied.
      </p>
      <p style="color: #57534e; font-size: 15px;"><strong>Reason:</strong> ${reason}</p>
      ${bookingSummaryHtml(booking)}
      <p style="color: #57534e; font-size: 15px;">If you have questions, please contact your property management office.</p>
    `),
  )
}

export async function notifyWaitlisted(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Waitlisted — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">You're on the waitlist</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, the time slot you requested for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> already has an active booking.
        Your request has been placed on the <strong>waitlist</strong>.
      </p>
      <p style="color: #57534e; font-size: 15px;">If the earlier booking is cancelled, you will be automatically promoted and notified.</p>
      ${bookingSummaryHtml(booking)}
    `),
  )
}

export async function notifyPromotedFromWaitlist(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Waitlist update — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Your booking is now active!</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, a slot opened up for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> and your waitlisted booking has been promoted.
        Your request is now being processed.
      </p>
      ${bookingSummaryHtml(booking)}
      <p style="color: #57534e; font-size: 15px;">You will receive further instructions shortly.</p>
    `),
  )
}

export async function sendPaymentLink(bookingId: string, paymentUrl: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Payment required — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Complete your payment</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, your booking for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> is ready for payment.
      </p>
      ${bookingSummaryHtml(booking)}
      <p style="text-align: center; margin: 24px 0;">
        <a href="${paymentUrl}" style="background: #059669; color: white; padding: 12px 28px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 14px;">Pay now to confirm</a>
      </p>
    `),
  )
}

export async function nudgePayment(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Payment pending — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Payment still pending</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, your booking for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> is still waiting on payment. Once payment is complete,
        your reservation will be confirmed.
      </p>
      ${bookingSummaryHtml(booking)}
    `),
  )
}

export async function sendConfirmation(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Booking confirmed — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Booking confirmed!</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, your booking for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> is confirmed. We look forward to hosting your event!
      </p>
      ${bookingSummaryHtml(booking)}
      ${accessNoticeHtml(booking.amenity)}
    `),
  )
}

export async function send48hrReminder(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Reminder — ${booking.amenity.name} at ${community} in 48 hours`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">48-hour reminder</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, this is your reminder that your booking for
        <strong>${booking.amenity.name}</strong> at <strong>${community}</strong>
        is coming up in 48 hours.
      </p>
      ${bookingSummaryHtml(booking)}
      <p style="color: #57534e; font-size: 15px;">Please review community rules and leave the space in great condition after your event.</p>
    `),
  )
}

export async function sendAccessInstructions(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  if (!booking.amenity.hasAccessInstructions || !booking.amenity.accessInstructions) return
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Access instructions — ${booking.amenity.name} at ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Access instructions</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, your booking for <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong> is coming up in 1 hour. Here are your access instructions:
      </p>
      <div style="background: #fafaf9; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <pre style="white-space: pre-wrap; font-family: sans-serif; color: #1c1917; margin: 0;">${booking.amenity.accessInstructions}</pre>
      </div>
      ${bookingSummaryHtml(booking)}
    `),
  )
}

export async function sendPostEventFollowUp(bookingId: string): Promise<void> {
  const booking = await getBooking(bookingId)
  const community = booking.communityName ?? 'your community'
  await sendToRecipients(booking,
    `Thanks for using ${booking.amenity.name} — ${community}`,
    emailWrapper(booking.communityName, `
      <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Thanks for booking!</h1>
      <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
        Hi ${booking.resident.name}, thanks for using <strong>${booking.amenity.name}</strong>
        at <strong>${community}</strong>. We hope everything went well!
      </p>
      <p style="color: #57534e; font-size: 15px;">Please share any feedback with your property management team.</p>
    `),
  )
}
