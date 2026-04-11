import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe as getStripe } from '@/lib/integrations/stripe'
import * as orchestrator from '@/lib/booking/workflow'
import {
  getCommunityByStripeSubscription,
  getCommunityByStripeCustomer,
  updateCommunity,
} from '@/lib/firebase/db'

export const runtime = 'nodejs'

// Map Stripe product/price to Neighbri plan + limits
// Uses the product name from Stripe (e.g. "Neighbri Essentials", "Neighbri Growth", "Neighbri Enterprise")
const PLAN_MAP: Record<string, { plan: 'standard' | 'growth' | 'premium'; maxAmenities: number; maxMembers: number }> = {
  essentials: { plan: 'standard', maxAmenities: 5, maxMembers: 100 },
  growth: { plan: 'growth', maxAmenities: 20, maxMembers: 1000 },
  enterprise: { plan: 'premium', maxAmenities: 999, maxMembers: 9999 },
}

function resolveStripePlan(subscription: Stripe.Subscription): Partial<{ plan: 'free' | 'standard' | 'growth' | 'premium'; maxAmenities: number; maxMembers: number }> {
  // Get the first subscription item's price → product name
  const item = subscription.items?.data?.[0]
  if (!item) return {}

  const price = item.price
  const productName = typeof price.product === 'string'
    ? price.product
    : (price.product as Stripe.Product)?.name ?? ''

  // Try matching by product name (case-insensitive)
  const nameLC = (typeof productName === 'string' ? productName : '').toLowerCase()

  for (const [key, value] of Object.entries(PLAN_MAP)) {
    if (nameLC.includes(key)) {
      return value
    }
  }

  // Also try matching by price nickname
  const nicknameLC = (price.nickname ?? '').toLowerCase()
  for (const [key, value] of Object.entries(PLAN_MAP)) {
    if (nicknameLC.includes(key)) {
      return value
    }
  }

  console.warn(`[Stripe Webhook] Could not resolve plan from product: "${productName}", nickname: "${price.nickname}"`)
  return {}
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('[Stripe Webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`)

  try {
    switch (event.type) {
      // ---- Booking payments ----
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
          await orchestrator.handlePaymentSuccess(bookingId)
          console.log(`[Stripe Webhook] Payment success for booking: ${bookingId}`)
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
          await orchestrator.handlePaymentFailed(bookingId)
          console.log(`[Stripe Webhook] Payment failed for booking: ${bookingId}`)
        }
        break
      }

      // ---- Subscription lifecycle ----
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status

        // Resolve plan from Stripe product name
        const planUpdate = resolveStripePlan(subscription)

        // Find community by customer ID
        const community = await getCommunityByStripeCustomer(customerId)
        if (community) {
          await updateCommunity(community.id, {
            stripeSubscriptionId: subscription.id,
            isActive: status === 'active' || status === 'trialing',
            ...planUpdate,
          })
          console.log(`[Stripe Webhook] Subscription ${status} for community ${community.id}, plan: ${planUpdate.plan ?? 'unchanged'}`)
        } else {
          console.log(`[Stripe Webhook] Subscription ${event.type} for unknown customer ${customerId} — will be linked on community creation`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Find community by subscription ID
        const community = await getCommunityByStripeSubscription(subscription.id)
          ?? await getCommunityByStripeCustomer(subscription.customer as string)

        if (community) {
          await updateCommunity(community.id, {
            isActive: false,
          })
          console.log(`[Stripe Webhook] Subscription cancelled — deactivated community ${community.id}`)
        } else {
          console.warn(`[Stripe Webhook] Subscription deleted but no community found for ${subscription.id}`)
        }
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Stripe Webhook] Error processing ${event.type}: ${message}`)
  }

  return NextResponse.json({ received: true })
}
