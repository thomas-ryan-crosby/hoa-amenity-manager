import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthContext } from '@/lib/auth'
import { adminAuth } from '@/lib/firebase/admin'
import {
  getAllCommunities,
  createCommunity,
  createCommunityMember,
  getResidentByFirebaseUid,
  createResident,
} from '@/lib/firebase/db'

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
  contactEmail: z.string().email('Valid email required'),
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

  // Look up the admin user in Firebase Auth by email
  let adminUid: string
  try {
    const adminUser = await adminAuth.getUserByEmail(adminEmail)
    adminUid = adminUser.uid
  } catch {
    return NextResponse.json(
      { error: `No account found for ${adminEmail}. The admin must sign up on Neighbri first.` },
      { status: 400 },
    )
  }

  // Create the community
  const community = await createCommunity({
    ...communityData,
    contactPhone: communityData.contactPhone ?? null,
    logoUrl: null,
    isActive: true,
    createdAt: new Date(),
    createdBy: auth.userId,
  })

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

  return NextResponse.json({ community }, { status: 201 })
}
