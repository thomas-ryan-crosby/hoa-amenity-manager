import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { updateResident, getResidentById } from '@/lib/firebase/db'
import { sendEmail } from '@/lib/integrations/gmail'

const UpdateResidentSchema = z.object({
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
  const parsed = UpdateResidentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const resident = await getResidentById(id)
  if (!resident) {
    return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
  }

  if (parsed.data.status) {
    await updateResident(id, { status: parsed.data.status })

    // Set Firebase Auth custom claims for role if approved
    if (parsed.data.status === 'approved') {
      const role = parsed.data.role ?? 'resident'
      const { adminAuth } = await import('@/lib/firebase/admin')
      await adminAuth.setCustomUserClaims(resident.firebaseUid, { role })

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

    if (parsed.data.status === 'denied') {
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

  if (parsed.data.role && parsed.data.status !== 'approved') {
    // Update role even without status change
    const { adminAuth } = await import('@/lib/firebase/admin')
    await adminAuth.setCustomUserClaims(resident.firebaseUid, { role: parsed.data.role })
  }

  return NextResponse.json({ success: true })
}
