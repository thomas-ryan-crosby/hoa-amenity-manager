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
  const { booking, amenity, resident, communityName: rawCommunityName, communityTimezone } = await getBookingWithRelations(bookingId)
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

  const communityName = rawCommunityName ?? 'Unknown community'

  await sendEmail({
    to: approverEmail,
    subject: `Approval needed — ${amenity.name} at ${communityName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <p style="color: #059669; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Neighbri</p>
        <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Booking approval requested</h1>
        <p style="color: #57534e; font-size: 15px;">A new booking request at <strong>${communityName}</strong> is waiting for your approval.</p>
        <div style="margin: 16px 0; padding: 16px; background: #fafaf9; border-radius: 12px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #1c1917;">
            <tr><td style="padding: 4px 0; color: #78716c;">Community</td><td style="padding: 4px 0; font-weight: 600;">${communityName}</td></tr>
            <tr><td style="padding: 4px 0; color: #78716c;">Resident</td><td style="padding: 4px 0;">${resident.name} (${resident.email})</td></tr>
            <tr><td style="padding: 4px 0; color: #78716c;">Unit</td><td style="padding: 4px 0;">${resident.unitNumber}</td></tr>
            <tr><td style="padding: 4px 0; color: #78716c;">Amenity</td><td style="padding: 4px 0; font-weight: 600;">${amenity.name}</td></tr>
            <tr><td style="padding: 4px 0; color: #78716c;">When</td><td style="padding: 4px 0;">${formatDateRange(booking.startDatetime, booking.endDatetime, communityTimezone ?? 'America/Chicago')}</td></tr>
            <tr><td style="padding: 4px 0; color: #78716c;">Guests</td><td style="padding: 4px 0;">${booking.guestCount}</td></tr>
            ${amenity.rentalFee > 0 ? `<tr><td style="padding: 4px 0; color: #78716c;">Rental fee</td><td style="padding: 4px 0;">${formatCurrency(amenity.rentalFee)}</td></tr>` : ''}
            ${amenity.depositAmount > 0 ? `<tr><td style="padding: 4px 0; color: #78716c;">Deposit</td><td style="padding: 4px 0;">${formatCurrency(amenity.depositAmount)}</td></tr>` : ''}
          </table>
        </div>
        <p style="margin: 20px 0;">
          <a href="${approveUrl}" style="background: #059669; color: white; padding: 10px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 14px; margin-right: 8px;">Approve</a>
          <a href="${denyUrl}" style="background: #dc2626; color: white; padding: 10px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 14px;">Deny</a>
        </p>
        <p style="color: #a8a29e; font-size: 13px; margin-top: 32px; border-top: 1px solid #e7e5e4; padding-top: 16px;">
          ${communityName} &mdash; powered by <a href="https://neighbri.com" style="color: #059669; text-decoration: none;">Neighbri</a>
        </p>
      </div>
    `,
  })
}

export async function notifyBillingIssue(bookingId: string, reason: string): Promise<void> {
  try {
    const { amenity, resident, communityId, communityName: rawCommunityName } = await getBookingWithRelations(bookingId)
    const settings = await getSettings(communityId ?? undefined)
    const pmEmail = settings.pmEmail
    if (!pmEmail) {
      console.error(`[PM] Billing issue on ${bookingId} but no pmEmail configured — cannot notify.`)
      return
    }
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const communityName = rawCommunityName ?? 'Unknown community'
    await sendEmail({
      to: pmEmail,
      subject: `Action needed — booking at ${communityName} is missing payment setup`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <p style="color: #dc2626; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Neighbri &mdash; Action needed</p>
          <h1 style="color: #1c1917; font-size: 22px; margin-top: 8px;">Billing not configured</h1>
          <p style="color: #57534e; font-size: 15px; line-height: 1.6;">${reason}</p>
          <div style="margin: 16px 0; padding: 16px; background: #fafaf9; border-radius: 12px; font-size: 14px;">
            <p style="margin: 0 0 4px; color: #78716c;">Booking</p>
            <p style="margin: 0 0 8px; font-weight: 600;">${amenity.name} &mdash; ${resident.name} (${resident.email})</p>
            <p style="margin: 0; color: #57534e; font-size: 13px;">
              ${amenity.rentalFee > 0 ? `Rental: ${formatCurrency(amenity.rentalFee)}` : ''}${amenity.rentalFee > 0 && amenity.depositAmount > 0 ? ' · ' : ''}${amenity.depositAmount > 0 ? `Deposit: ${formatCurrency(amenity.depositAmount)}` : ''}
            </p>
          </div>
          <p style="margin: 20px 0;">
            <a href="${baseUrl}/admin/billing" style="background: #1c1917; color: white; padding: 10px 24px; border-radius: 9999px; text-decoration: none; display: inline-block; font-weight: 600; font-size: 14px;">Open billing settings</a>
          </p>
          <p style="color: #a8a29e; font-size: 13px; margin-top: 32px; border-top: 1px solid #e7e5e4; padding-top: 16px;">
            ${communityName} &mdash; powered by <a href="https://neighbri.com" style="color: #059669; text-decoration: none;">Neighbri</a>
          </p>
        </div>
      `,
    })
  } catch (err) {
    console.error(`[PM] Failed to notify billing issue for ${bookingId}:`, err)
  }
}
