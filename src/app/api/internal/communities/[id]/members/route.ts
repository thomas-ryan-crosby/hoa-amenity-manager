import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '../../route'
import { adminAuth } from '@/lib/firebase/admin'
import {
  getCommunityById,
  getCommunityMember,
  getCommunityMembers,
  createCommunityMember,
  createPendingAdminInvite,
  updateCommunityMember,
  getResidentByFirebaseUid,
  createResident,
} from '@/lib/firebase/db'
import { sendEmail } from '@/lib/integrations/gmail'

const AddMemberSchema = z.object({
  email: z.string().email('Valid email required'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'property_manager', 'resident', 'janitorial', 'board']),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id: communityId } = await params

  const community = await getCommunityById(communityId)
  if (!community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = AddMemberSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { email, name, role } = parsed.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'

  // Try to find the user in Firebase Auth
  try {
    const firebaseUser = await adminAuth.getUserByEmail(email)
    const uid = firebaseUser.uid

    // Check if already a member
    const existing = await getCommunityMember(uid, communityId)
    if (existing) {
      return NextResponse.json(
        { error: `${email} is already a member of this community.` },
        { status: 409 },
      )
    }

    // Get or create resident
    let resident = await getResidentByFirebaseUid(uid)
    if (!resident) {
      resident = await createResident({
        firebaseUid: uid,
        name,
        email,
        phone: null,
        unitNumber: '',
        stripeCustomerId: null,
        status: 'approved',
        createdAt: new Date(),
      })
    }

    // Create membership
    await createCommunityMember({
      communityId,
      userId: uid,
      residentId: resident.id,
      role,
      status: 'approved',
      unitNumber: '',
      joinedAt: new Date(),
      approvedBy: auth.userId,
      approvedAt: new Date(),
    })

    return NextResponse.json({ linked: true, invited: false })
  } catch {
    // User doesn't have an account — store pending invite + send email
    await createPendingAdminInvite({
      communityId,
      email: email.toLowerCase(),
      name,
      role: role as 'admin' | 'property_manager',
      createdBy: auth.userId,
      createdAt: new Date(),
    })

    const roleLabel = role.replace('_', ' ')

    sendEmail({
      to: email,
      subject: `You've been invited to ${community.name} on Neighbri`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <p style="color: #059669; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Neighbri</p>
          <h1 style="color: #1c1917; font-size: 24px; margin-top: 8px;">You're invited!</h1>
          <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
            Hi ${name}, you've been added as <strong>${roleLabel}</strong> for
            <strong>${community.name}</strong> on Neighbri.
          </p>
          <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
            Create your account to get started:
          </p>
          <a href="${appUrl}/sign-up"
             style="display: inline-block; background: #059669; color: white; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Create your account
          </a>
          <p style="color: #78716c; font-size: 13px; margin-top: 16px;">
            Use <strong>${email}</strong> when signing up so your access is linked automatically.
          </p>
          <p style="color: #a8a29e; font-size: 13px; margin-top: 32px;">
            Neighbri &mdash; Amenity booking for your community
          </p>
        </div>
      `,
    }).catch((err) => {
      console.error('[Email] Member invite failed:', err)
    })

    return NextResponse.json({ linked: false, invited: true })
  }
}

// ---------------------------------------------------------------------------
// PUT — update a member's role (super-admin only)
// ---------------------------------------------------------------------------

const UpdateRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(['admin', 'property_manager', 'resident', 'janitorial', 'board']),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id: communityId } = await params
  const body = await req.json().catch(() => null)
  const parsed = UpdateRoleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { memberId, role } = parsed.data
  const members = await getCommunityMembers(communityId)
  const member = members.find((m) => m.id === memberId)
  if (!member) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  // Enforce min-1-admin
  if (member.role === 'admin' && role !== 'admin') {
    const adminCount = members.filter((m) => m.role === 'admin' && m.status === 'approved').length
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'Cannot remove the last admin. Assign another admin first.' },
        { status: 400 },
      )
    }
  }

  await updateCommunityMember(memberId, { role })
  return NextResponse.json({ success: true })
}
