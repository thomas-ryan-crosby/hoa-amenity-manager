import {
  getBookingWithRelations,
  getStaffByRole,
  getStaffById,
  countRecentInspectionsByStaff,
  addAuditLog,
  getBookingAuditLogs,
  getInspectionReport,
  getAmenityById,
} from '@/lib/firebase/db'
import { formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'
import { sendSMS } from '@/lib/integrations/twilio'

/**
 * Round-robin assignment: pick the janitorial staff member with the fewest
 * recent assignments. Falls back to first available if counts are equal.
 */
async function assignJanitorialStaff(amenityId: string) {
  const amenity = await getAmenityById(amenityId)

  if (amenity?.janitorialAssignment === 'manual') {
    return null // Manual assignment — PM will assign via dashboard
  }

  const janitorialStaff = await getStaffByRole('JANITORIAL')

  if (janitorialStaff.length === 0) return null
  if (janitorialStaff.length === 1) return janitorialStaff[0]

  // Count recent assignments (last 30 days) per staff member
  const staffIds = janitorialStaff.map((s) => s.id)
  const countMap = await countRecentInspectionsByStaff(staffIds, 30)

  // Sort staff by assignment count (ascending) for round-robin
  janitorialStaff.sort(
    (a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0),
  )

  return janitorialStaff[0]
}

export async function notifyJobAssigned(bookingId: string): Promise<void> {
  const { booking, amenity } = await getBookingWithRelations(bookingId)

  const staff = await assignJanitorialStaff(booking.amenityId)

  if (!staff) {
    console.log(
      `[JanitorialAgent] No janitorial staff auto-assigned for ${bookingId} (manual mode or no staff)`,
    )
    return
  }

  const inspectionUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  }/janitorial/inspect/${bookingId}`

  await sendEmail({
    to: staff.email,
    subject: `New janitorial assignment: ${amenity.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #1a1a1a;">New Job Assignment</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; font-weight: bold;">Amenity:</td><td>${amenity.name}</td></tr>
          <tr><td style="padding: 6px 0; font-weight: bold;">When:</td><td>${formatDateRange(booking.startDatetime, booking.endDatetime)}</td></tr>
        </table>
        <h3 style="margin-top: 16px;">Pre-Event Setup Checklist</h3>
        <ul style="padding-left: 18px; line-height: 1.8;">
          <li>Unlock facility</li>
          <li>Check supplies (paper towels, soap, trash bags)</li>
          <li>Set up tables and chairs as needed</li>
          <li>Verify restrooms are stocked and clean</li>
        </ul>
        <p style="margin-top: 16px;">
          <a href="${inspectionUrl}" style="background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
            Open Inspection Form
          </a>
        </p>
      </div>
    `,
  })

  if (staff.phone) {
    await sendSMS(
      staff.phone,
      `New job: ${amenity.name} on ${new Date(booking.startDatetime).toLocaleDateString()}. Inspection: ${inspectionUrl}`,
    )
  }

  // Record the assignment in audit log
  await addAuditLog(bookingId, 'janitorial-agent', 'JOB_ASSIGNED', {
    staffId: staff.id,
    staffName: staff.name,
  })
}

export async function sendInspectionReminder(
  bookingId: string,
): Promise<void> {
  const { booking, amenity } = await getBookingWithRelations(bookingId)

  // Skip if inspection already submitted
  const inspection = await getInspectionReport(bookingId)
  if (inspection) return

  // Find who was assigned via audit log
  const auditLogs = await getBookingAuditLogs(bookingId)
  const assignmentLog = auditLogs
    .filter((log) => log.agent === 'janitorial-agent' && log.event === 'JOB_ASSIGNED')
    .sort((a, b) => {
      const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime()
      const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime()
      return bTime - aTime
    })[0]

  const staffId = (assignmentLog?.payload as { staffId?: string })?.staffId
  if (!staffId) return

  const staff = await getStaffById(staffId)
  if (!staff?.phone) return

  const inspectionUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  }/janitorial/inspect/${bookingId}`

  await sendSMS(
    staff.phone,
    `Reminder: complete inspection for ${amenity.name}. ${inspectionUrl}`,
  )
}
