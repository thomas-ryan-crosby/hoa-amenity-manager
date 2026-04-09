import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth'
import { adminAuth } from '@/lib/firebase/admin'
import {
  getAllCommunities,
  createCommunity,
  createCommunityMember,
  createPendingAdminInvite,
  getResidentByFirebaseUid,
  createResident,
} from '@/lib/firebase/db'
import { sendEmail } from '@/lib/integrations/gmail'

// ---------------------------------------------------------------------------
// Super-admin auth helper
// ---------------------------------------------------------------------------

export async function requireSuperAdmin() {
  const { userId } = await getAuthContext()
  if (!userId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 },
      ),
    }
  }

  const user = await adminAuth.getUser(userId)
  if (!user.customClaims?.superAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 },
      ),
    }
  }

  return { ok: true as const, userId }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const CreateCommunitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2-letter code'),
  zip: z.string().min(5, 'Zip code is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  plan: z.enum(['free', 'standard', 'premium']),
  maxAmenities: z.number().int().positive(),
  maxMembers: z.number().int().positive(),
  // First admin — required for every new community
  adminEmail: z.string().email('Admin email is required'),
  adminName: z.string().min(1, 'Admin name is required'),
})

// ---------------------------------------------------------------------------
// GET — list all communities
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const communities = await getAllCommunities()

  return NextResponse.json({ communities })
}

// ---------------------------------------------------------------------------
// POST — create a new community
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = CreateCommunitySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid community payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const { adminEmail, adminName, ...communityData } = parsed.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'

  // Create the community first
  const community = await createCommunity({
    ...communityData,
    contactEmail: communityData.contactEmail ?? null,
    contactPhone: communityData.contactPhone ?? null,
    logoUrl: null,
    isActive: true,
    createdAt: new Date(),
    createdBy: auth.userId,
  })

  // Try to find the admin in Firebase Auth
  let adminLinked = false
  try {
    const adminUser = await adminAuth.getUserByEmail(adminEmail)
    const adminUid = adminUser.uid

    // Get or create a resident record for the admin
    let resident = await getResidentByFirebaseUid(adminUid)
    if (!resident) {
      resident = await createResident({
        firebaseUid: adminUid,
        name: adminName,
        email: adminEmail,
        phone: null,
        unitNumber: '',
        stripeCustomerId: null,
        status: 'approved',
        createdAt: new Date(),
      })
    }

    // Create the admin community membership (approved immediately)
    await createCommunityMember({
      communityId: community.id,
      userId: adminUid,
      residentId: resident.id,
      role: 'admin',
      status: 'approved',
      unitNumber: resident.unitNumber ?? '',
      joinedAt: new Date(),
      approvedBy: auth.userId,
      approvedAt: new Date(),
    })
    adminLinked = true
  } catch {
    // Admin doesn't have an account yet — store a pending invite
    await createPendingAdminInvite({
      communityId: community.id,
      email: adminEmail.toLowerCase(),
      name: adminName,
      role: 'admin',
      createdBy: auth.userId,
      createdAt: new Date(),
    })

    // Send them an invitation email
    sendEmail({
      to: adminEmail,
      subject: `You've been invited to manage ${community.name} on Neighbri`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <p style="color: #059669; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Neighbri</p>
          <h1 style="color: #1c1917; font-size: 24px; margin-top: 8px;">You're invited!</h1>
          <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
            Hi ${adminName}, you've been set up as the admin for
            <strong>${community.name}</strong> on Neighbri.
          </p>
          <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
            Neighbri is an amenity booking platform for your community. As admin,
            you'll manage amenities, approve bookings, and oversee community settings.
          </p>
          <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
            Create your account to get started:
          </p>
          <a href="${appUrl}/sign-up"
             style="display: inline-block; background: #059669; color: white; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Create your account
          </a>
          <p style="color: #78716c; font-size: 13px; margin-top: 16px;">
            Use this email address (<strong>${adminEmail}</strong>) when signing up
            so your admin access is linked automatically.
          </p>
          <p style="color: #a8a29e; font-size: 13px; margin-top: 32px;">
            Neighbri &mdash; Amenity booking for your community
          </p>
        </div>
      `,
    }).catch((err) => {
      console.error('[Email] Admin invite email failed:', err)
    })
  }

  return NextResponse.json({
    community,
    adminLinked,
    adminInviteSent: !adminLinked,
  }, { status: 201 })
}
