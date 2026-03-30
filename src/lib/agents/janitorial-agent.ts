import { prisma } from '@/lib/db/client'
import { formatDateRange } from '@/lib/format'
import { sendEmail } from '@/lib/integrations/gmail'
import { sendSMS } from '@/lib/integrations/twilio'

/**
 * Round-robin assignment: pick the janitorial staff member with the fewest
 * recent assignments. Falls back to first available if counts are equal.
 */
async function assignJanitorialStaff(amenityId: string) {
  const amenity = await prisma.amenity.findUnique({
    where: { id: amenityId },
    select: { janitorialAssignment: true },
  })

  if (amenity?.janitorialAssignment === 'manual') {
    return null // Manual assignment — PM will assign via dashboard
  }

  const janitorialStaff = await prisma.staff.findMany({
    where: { role: 'JANITORIAL' },
  })

  if (janitorialStaff.length === 0) return null
  if (janitorialStaff.length === 1) return janitorialStaff[0]

  // Count recent assignments (last 30 days) per staff member
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const assignmentCounts = await prisma.inspectionReport.groupBy({
    by: ['staffId'],
    where: {
      submittedAt: { gte: thirtyDaysAgo },
      staffId: { in: janitorialStaff.map((s) => s.id) },
    },
    _count: { staffId: true },
  })

  const countMap = new Map(
    assignmentCounts.map((a) => [a.staffId, a._count.staffId]),
  )

  // Sort staff by assignment count (ascending) for round-robin
  janitorialStaff.sort(
    (a, b) => (countMap.get(a.id) ?? 0) - (countMap.get(b.id) ?? 0),
  )

  return janitorialStaff[0]
}

export async function notifyJobAssigned(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { amenity: true },
  })

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
    subject: `New janitorial assignment: ${booking.amenity.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px;">
        <h2 style="color: #1a1a1a;">New Job Assignment</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; font-weight: bold;">Amenity:</td><td>${booking.amenity.name}</td></tr>
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
      `New job: ${booking.amenity.name} on ${new Date(booking.startDatetime).toLocaleDateString()}. Inspection: ${inspectionUrl}`,
    )
  }

  // Record the assignment in audit log
  await prisma.auditLog.create({
    data: {
      bookingId,
      agent: 'janitorial-agent',
      event: 'JOB_ASSIGNED',
      payload: { staffId: staff.id, staffName: staff.name },
    },
  })
}

export async function sendInspectionReminder(
  bookingId: string,
): Promise<void> {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { amenity: true, inspectionReport: true },
  })

  // Skip if inspection already submitted
  if (booking.inspectionReport) return

  // Find who was assigned via audit log
  const assignmentLog = await prisma.auditLog.findFirst({
    where: {
      bookingId,
      agent: 'janitorial-agent',
      event: 'JOB_ASSIGNED',
    },
    orderBy: { timestamp: 'desc' },
  })

  const staffId = (assignmentLog?.payload as { staffId?: string })?.staffId
  if (!staffId) return

  const staff = await prisma.staff.findUnique({ where: { id: staffId } })
  if (!staff?.phone) return

  const inspectionUrl = `${
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  }/janitorial/inspect/${bookingId}`

  await sendSMS(
    staff.phone,
    `Reminder: complete inspection for ${booking.amenity.name}. ${inspectionUrl}`,
  )
}
