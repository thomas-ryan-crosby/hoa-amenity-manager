import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import * as orchestrator from '@/lib/booking/workflow'
import { getCommunityById, getSettings } from '@/lib/firebase/db'

export const runtime = 'nodejs'

/**
 * Per-community Stripe webhook for booking payments.
 * Each community has its own Stripe account with keys stored in
 * their community settings. The webhook URL includes the communityId
 * so we can look up the correct webhook secret for verification.
 *
 * URL: https://neighbri.com/api/webhooks/stripe/community/[communityId]
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ communityId: string }> },
) {
  const { communityId } = await params
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error(`[Community Webhook ${communityId}] Missing stripe-signature header`)
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  // Look up the community's Stripe config
  const community = await getCommunityById(communityId)
  if (!community) {
    console.error(`[Community Webhook] Community not found: ${communityId}`)
    return NextResponse.json({ error: 'Community not found' }, { status: 404 })
  }

  const settings = await getSettings(communityId)
  if (!settings.stripeWebhookSecret || !settings.stripeSecretKey) {
    console.error(`[Community Webhook ${communityId}] Stripe not configured`)
    return NextResponse.json({ error: 'Stripe not configured for this community' }, { status: 400 })
  }

  // Create a Stripe instance with the community's secret key
  const stripe = new Stripe(settings.stripeSecretKey, {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
  })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, settings.stripeWebhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Community Webhook ${communityId}] Signature verification failed: ${message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Community Webhook ${communityId}] Received event: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
          await orchestrator.handlePaymentSuccess(bookingId)
          console.log(`[Community Webhook ${communityId}] Payment success for booking: ${bookingId}`)
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
          await orchestrator.handlePaymentFailed(bookingId)
          console.log(`[Community Webhook ${communityId}] Payment expired for booking: ${bookingId}`)
        }
        break
      }

      default:
        console.log(`[Community Webhook ${communityId}] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Community Webhook ${communityId}] Error processing ${event.type}: ${message}`)
  }

  return NextResponse.json({ received: true })
}
