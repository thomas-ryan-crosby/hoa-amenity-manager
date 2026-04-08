import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase/admin'
import {
  getResidentByFirebaseUid,
  createResident,
  getPendingAdminInvitesByEmail,
  deletePendingAdminInvite,
  createCommunityMember,
} from '@/lib/firebase/db'
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

  // Set a minimal default role claim — per-community roles live in communityMembers
  await adminAuth.setCustomUserClaims(decoded.uid, { role: 'resident' })

  // Create resident record (status kept for backward compat but communities use communityMember.status)
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

  // Check for pending admin invites and auto-link
  const pendingInvites = await getPendingAdminInvitesByEmail(resident.email)
  for (const invite of pendingInvites) {
    try {
      await createCommunityMember({
        communityId: invite.communityId,
        userId: decoded.uid,
        residentId: resident.id,
        role: invite.role,
        status: 'approved',
        unitNumber: '',
        joinedAt: new Date(),
        approvedBy: invite.createdBy,
        approvedAt: new Date(),
      })
      await deletePendingAdminInvite(invite.id)
      console.log(`[Sign-up] Auto-linked ${resident.email} as ${invite.role} for community ${invite.communityId}`)
    } catch (err) {
      console.error(`[Sign-up] Failed to link pending invite ${invite.id}:`, err)
    }
  }

  // Send welcome email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'

  sendEmail({
    to: resident.email,
    subject: `Welcome to Neighbri!`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
        <p style="color: #059669; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Neighbri</p>
        <h1 style="color: #1c1917; font-size: 24px; margin-top: 8px;">Welcome, ${resident.name}!</h1>
        <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
          Thanks for signing up for Neighbri! Neighbri makes it easy to browse and book
          amenities in your community &mdash; from clubhouses to pools, courts, and more.
        </p>
        <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
          A property manager will review your request and you'll receive an email once
          you've been approved. After that, you can start browsing and booking amenities.
        </p>
        <div style="margin: 24px 0; padding: 20px; background: #fafaf9; border-radius: 16px;">
          <p style="margin: 0 0 4px; color: #78716c; font-size: 13px;">YOUR ACCOUNT</p>
          <p style="margin: 0; color: #1c1917; font-size: 15px;"><strong>${resident.name}</strong></p>
          <p style="margin: 0; color: #57534e; font-size: 14px;">${resident.email}</p>
        </div>
        <a href="${appUrl}/resident"
           style="display: inline-block; background: #059669; color: white; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">
          Go to Neighbri
        </a>
        <p style="color: #a8a29e; font-size: 13px; margin-top: 32px;">
          Neighbri &mdash; Amenity booking for your community
        </p>
      </div>
    `,
  }).catch((err) => {
    console.error('[Sign-up] Welcome email failed:', err)
  })

  return NextResponse.json({ resident }, { status: 201 })
}
