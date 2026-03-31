import jwt from 'jsonwebtoken'
import { getBookingWithRelations, getStaffById } from '@/lib/firebase/db'
import { formatCurrency, formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'

function createActionToken(
  bookingId: string,
  action: 'approve' | 'deny',
): string {
  return jwt.sign(
    { bookingId, action },
    process.env.PM_APPROVAL_JWT_SECRET!,
    { expiresIn: '48h' },
  )
}

export async function sendApprovalRequest(bookingId: string): Promise<void> {
  const { booking, amenity, resident } = await getBookingWithRelations(bookingId)

  let approverEmail: string | undefined
  if (amenity.approverStaffId) {
    const approverStaff = await getStaffById(amenity.approverStaffId)
    approverEmail = approverStaff?.email
  }
  approverEmail = approverEmail ?? process.env.PM_EMAIL

  if (!approverEmail) {
    throw new Error('No approver email is configured for PM approvals')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const approveUrl = `${baseUrl}/api/admin/approve/${createActionToken(bookingId, 'approve')}`
  const denyUrl = `${baseUrl}/api/admin/deny/${createActionToken(bookingId, 'deny')}`

  await sendEmail({
    to: approverEmail,
    subject: `Approval requested: ${amenity.name}`,
    html: `
      <p>A new booking request is waiting for approval.</p>
      <ul style="padding-left: 18px; line-height: 1.6;">
        <li><strong>Resident:</strong> ${resident.name} (${resident.email})</li>
        <li><strong>Unit:</strong> ${resident.unitNumber}</li>
        <li><strong>Amenity:</strong> ${amenity.name}</li>
        <li><strong>When:</strong> ${formatDateRange(booking.startDatetime, booking.endDatetime)}</li>
        <li><strong>Guests:</strong> ${booking.guestCount}</li>
        <li><strong>Rental fee:</strong> ${formatCurrency(amenity.rentalFee)}</li>
        <li><strong>Deposit:</strong> ${formatCurrency(amenity.depositAmount)}</li>
      </ul>
      <p><a href="${approveUrl}">Approve booking</a></p>
      <p><a href="${denyUrl}">Deny booking</a></p>
    `,
  })
}
