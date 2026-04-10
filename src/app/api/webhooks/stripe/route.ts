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

        // Find community by customer ID
        const community = await getCommunityByStripeCustomer(customerId)
        if (community) {
          await updateCommunity(community.id, {
            stripeSubscriptionId: subscription.id,
            isActive: status === 'active' || status === 'trialing',
          })
          console.log(`[Stripe Webhook] Subscription ${status} for community ${community.id}`)
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
