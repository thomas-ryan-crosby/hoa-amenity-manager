import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import { getCommunityById } from '@/lib/firebase/db'
import Stripe from 'stripe'

/**
 * POST — create a Stripe Customer Portal session for the community's
 * subscription management. Redirects the admin to Stripe's hosted portal
 * where they can update payment methods, change plans, or cancel.
 */
export async function POST() {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const communityId = await getActiveCommunityId()
  if (!communityId) {
    return NextResponse.json({ error: 'No active community' }, { status: 400 })
  }

  const community = await getCommunityById(communityId)
  if (!community) {
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  if (!community.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe subscription found. Please contact support@neighbri.com for assistance.' },
      { status: 400 },
    )
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 })
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: community.stripeCustomerId,
      return_url: `${appUrl}/admin/billing`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Billing Portal] Error creating session for ${community.stripeCustomerId}:`, message)
    return NextResponse.json({ error: `Unable to open billing portal: ${message}` }, { status: 500 })
  }
}
