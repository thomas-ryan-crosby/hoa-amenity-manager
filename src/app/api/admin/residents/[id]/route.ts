import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { updateCommunityMember, getCommunityMembers, getResidentById } from '@/lib/firebase/db'
import { sendEmail } from '@/lib/integrations/gmail'
import { getActiveCommunityId } from '@/lib/community'

const UpdateMemberSchema = z.object({
  status: z.enum(['approved', 'denied', 'pending']).optional(),
  role: z.enum(['resident', 'property_manager', 'janitorial', 'board']).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = UpdateMemberSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // The id param is now a communityMember ID
  // Look it up from the community members list to get resident details
  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const members = await getCommunityMembers(communityId)
  const member = members.find((m) => m.id === id)
  if (!member) {
    return NextResponse.json({ error: 'Community member not found' }, { status: 404 })
  }

  const resident = await getResidentById(member.residentId)

  // Handle status change
  if (parsed.data.status && parsed.data.status !== member.status) {
    const updateData: Partial<{ status: string; approvedBy: string; approvedAt: Date }> = {
      status: parsed.data.status,
    }
    if (parsed.data.status === 'approved') {
      updateData.approvedBy = authState.userId
      updateData.approvedAt = new Date()
    }
    await updateCommunityMember(id, updateData as any)

    if (parsed.data.status === 'approved' && resident) {
      sendEmail({
        to: resident.email,
        subject: 'Your account has been approved!',
        html: `
          <div style="font-family: sans-serif; max-width: 520px;">
            <h1 style="color: #1c1917; font-size: 24px;">Welcome, ${resident.name}!</h1>
            <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
              Your account has been approved. You can now browse amenities and submit booking requests.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'}/resident"
               style="display: inline-block; background: #059669; color: white; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Start booking
            </a>
          </div>
        `,
      }).catch((err) => console.error('[Email] Approval notification failed:', err))
    }

    if (parsed.data.status === 'denied' && resident) {
      sendEmail({
        to: resident.email,
        subject: 'Account request update',
        html: `
          <div style="font-family: sans-serif; max-width: 520px;">
            <h1 style="color: #1c1917; font-size: 24px;">Account Update</h1>
            <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
              Your account request has not been approved at this time.
              Please contact the property management office for more information.
            </p>
          </div>
        `,
      }).catch((err) => console.error('[Email] Denial notification failed:', err))
    }
  }

  // Handle role change — update communityMember, not Firebase Auth claims
  if (parsed.data.role && parsed.data.role !== member.role) {
    await updateCommunityMember(id, { role: parsed.data.role })
  }

  return NextResponse.json({ success: true })
}
