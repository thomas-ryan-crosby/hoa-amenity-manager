import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { getBookingWithRelations, getStaffById, getSettings, updateSettings } from '@/lib/firebase/db'
import { formatCurrency, formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'

async function getJwtSecret(): Promise<string> {
  const settings = await getSettings()
  if (settings.approvalJwtSecret) return settings.approvalJwtSecret

  // Auto-generate and persist a secret if none is set
  const secret = crypto.randomBytes(32).toString('hex')
  await updateSettings({ approvalJwtSecret: secret })
  return secret
}

async function createActionToken(
  bookingId: string,
  action: 'approve' | 'deny',
): Promise<string> {
  const secret = await getJwtSecret()
  return jwt.sign({ bookingId, action }, secret, { expiresIn: '48h' })
}

export async function verifyActionToken(
  token: string,
): Promise<{ bookingId: string; action: string }> {
  const secret = await getJwtSecret()
  return jwt.verify(token, secret) as { bookingId: string; action: string }
}

export async function sendApprovalRequest(bookingId: string): Promise<void> {
  const { booking, amenity, resident } = await getBookingWithRelations(bookingId)
  const settings = await getSettings()

  let approverEmail: string | undefined
  if (amenity.approverStaffId) {
    const approverStaff = await getStaffById(amenity.approverStaffId)
    approverEmail = approverStaff?.email
  }
  approverEmail = approverEmail ?? (settings.pmEmail || undefined)

  if (!approverEmail) {
    throw new Error('No approver email configured. Set PM Email in Admin > Settings.')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const approveToken = await createActionToken(bookingId, 'approve')
  const denyToken = await createActionToken(bookingId, 'deny')
  const approveUrl = `${baseUrl}/api/admin/approve/${approveToken}`
  const denyUrl = `${baseUrl}/api/admin/deny/${denyToken}`

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
