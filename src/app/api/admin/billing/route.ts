import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import { getCommunityById, getCommunityMembers, getSettings, updateSettings } from '@/lib/firebase/db'
import { adminDb } from '@/lib/firebase/admin'

// ---------------------------------------------------------------------------
// GET — billing info for the active community (admin only)
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const [community, members, settings] = await Promise.all([
    getCommunityById(communityId),
    getCommunityMembers(communityId),
    getSettings(communityId),
  ])

  if (!community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  const amenitiesSnap = await adminDb
    .collection('amenities')
    .where('communityId', '==', communityId)
    .get()

  const approvedMembers = members.filter((m) => m.status === 'approved').length

  return NextResponse.json({
    billing: {
      communityId,
      communityName: community.name,
      plan: community.plan,
      maxAmenities: community.maxAmenities,
      maxMembers: community.maxMembers,
      currentAmenities: amenitiesSnap.size,
      currentMembers: approvedMembers,
      hasSubscription: !!community.stripeCustomerId,
      billingMode: settings.billingMode ?? null,
    },
    stripe: {
      connected: settings.stripeConnected ?? false,
      hasPublishableKey: !!settings.stripePublishableKey,
      hasSecretKey: !!settings.stripeSecretKey,
      hasWebhookSecret: !!settings.stripeWebhookSecret,
    },
  })
}

// ---------------------------------------------------------------------------
// PUT — update Stripe configuration (admin only)
// ---------------------------------------------------------------------------

const UpdateStripeSchema = z.object({
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
  billingMode: z.enum(['stripe', 'ledger']).nullable().optional(),
})

export async function PUT(req: NextRequest) {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateStripeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (parsed.data.stripePublishableKey !== undefined) update.stripePublishableKey = parsed.data.stripePublishableKey
  if (parsed.data.stripeSecretKey !== undefined) update.stripeSecretKey = parsed.data.stripeSecretKey
  if (parsed.data.stripeWebhookSecret !== undefined) update.stripeWebhookSecret = parsed.data.stripeWebhookSecret
  if (parsed.data.billingMode !== undefined) update.billingMode = parsed.data.billingMode

  // Mark as connected if all three keys are present
  const settings = await getSettings(communityId)
  const pk = parsed.data.stripePublishableKey ?? settings.stripePublishableKey
  const sk = parsed.data.stripeSecretKey ?? settings.stripeSecretKey
  const wh = parsed.data.stripeWebhookSecret ?? settings.stripeWebhookSecret
  update.stripeConnected = !!(pk && sk && wh)

  await updateSettings(update, communityId)

  return NextResponse.json({
    success: true,
    stripeConnected: update.stripeConnected,
    billingMode: update.billingMode ?? settings.billingMode ?? null,
  })
}
