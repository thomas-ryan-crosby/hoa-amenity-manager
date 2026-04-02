import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase/admin'
import { getResidentByFirebaseUid, createResident, getSettings } from '@/lib/firebase/db'
import { sendEmail } from '@/lib/integrations/gmail'

const SignUpSchema = z.object({
  idToken: z.string().min(1),
  name: z.string().min(1),
  unitNumber: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = SignUpSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid sign-up data' }, { status: 400 })
  }

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(parsed.data.idToken)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Check if resident already exists
  const existing = await getResidentByFirebaseUid(decoded.uid)
  if (existing) {
    return NextResponse.json({ resident: existing })
  }

  // Set default role
  await adminAuth.setCustomUserClaims(decoded.uid, { role: 'resident' })

  // Create resident record — pending approval
  const resident = await createResident({
    firebaseUid: decoded.uid,
    name: parsed.data.name,
    email: decoded.email ?? '',
    phone: null,
    unitNumber: parsed.data.unitNumber ?? '',
    stripeCustomerId: null,
    status: 'pending',
    createdAt: new Date(),
  })

  // Send welcome email
  const settings = await getSettings()
  const orgName = settings.orgName || 'Neighbri'

  sendEmail({
    to: resident.email,
    subject: `Welcome to ${orgName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <h1 style="color: #1c1917; font-size: 24px;">Welcome, ${resident.name}!</h1>
        <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
          Your account has been created and is <strong>pending approval</strong> by a property manager.
          You'll receive another email once your account is approved and you can start booking amenities.
        </p>
        <div style="margin: 24px 0; padding: 20px; background: #fafaf9; border-radius: 16px;">
          <p style="margin: 0 0 4px; color: #78716c; font-size: 13px;">YOUR ACCOUNT</p>
          <p style="margin: 0; color: #1c1917; font-size: 15px;"><strong>${resident.name}</strong></p>
          <p style="margin: 0; color: #57534e; font-size: 14px;">${resident.email}</p>
          <p style="margin: 4px 0 0; color: #F59E0B; font-size: 13px; font-weight: 600;">Status: Pending approval</p>
        </div>
        <p style="color: #57534e; font-size: 14px;">
          In the meantime, you can browse available amenities and check the calendar.
        </p>
        <p style="color: #a8a29e; font-size: 13px; margin-top: 32px;">
          ${orgName} Amenity Booking System
        </p>
      </div>
    `,
  }).catch((err) => {
    console.error('[Sign-up] Welcome email failed:', err)
  })

  return NextResponse.json({ resident }, { status: 201 })
}
