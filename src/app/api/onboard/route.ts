import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import {
  createCommunity,
  createCommunityMember,
  getResidentByFirebaseUid,
  getCommunityBySlug,
} from '@/lib/firebase/db'

const OnboardSchema = z.object({
  name: z.string().min(2, 'Community name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().length(2, 'State must be 2-letter code'),
  zip: z.string().min(5, 'Zip code is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  plan: z.enum(['free', 'standard', 'premium']),
})

export async function POST(req: NextRequest) {
  const auth = await requireUser()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = OnboardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { name, address, city, state, zip, timezone, plan } = parsed.data

  // Generate slug from name
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Ensure slug is unique
  const existing = await getCommunityBySlug(slug)
  if (existing) {
    slug = `${slug}-${Date.now().toString(36)}`
  }

  // Plan limits
  const planLimits: Record<string, { maxAmenities: number; maxMembers: number }> = {
    free: { maxAmenities: 3, maxMembers: 25 },
    standard: { maxAmenities: 15, maxMembers: 500 },
    premium: { maxAmenities: 999, maxMembers: 9999 },
  }
  const limits = planLimits[plan] ?? planLimits.free

  // Create the community
  const community = await createCommunity({
    name,
    slug,
    address,
    city,
    state,
    zip,
    timezone,
    logoUrl: null,
    contactEmail: null,
    contactPhone: null,
    plan,
    isActive: true,
    maxAmenities: limits.maxAmenities,
    maxMembers: limits.maxMembers,
    createdAt: new Date(),
    createdBy: auth.userId,
  })

  // Make the current user the admin
  const resident = await getResidentByFirebaseUid(auth.userId)
  if (resident) {
    await createCommunityMember({
      communityId: community.id,
      userId: auth.userId,
      residentId: resident.id,
      role: 'admin',
      status: 'approved',
      unitNumber: resident.unitNumber ?? '',
      joinedAt: new Date(),
      approvedBy: auth.userId,
      approvedAt: new Date(),
    })
  }

  // Set as active community
  const res = NextResponse.json({ community, slug: community.slug })
  res.cookies.set('__activeCommunity', community.id, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  })
  return res
}
