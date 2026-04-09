import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe as getStripe } from '@/lib/integrations/stripe'
import * as orchestrator from '@/lib/booking/workflow'

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
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
          await orchestrator.handlePaymentSuccess(bookingId)
          console.log(`[Stripe Webhook] Payment success handled for booking: ${bookingId}`)
        } else {
          console.warn('[Stripe Webhook] checkout.session.completed missing bookingId in metadata')
        }
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingId = session.metadata?.bookingId
        if (bookingId) {
          await orchestrator.handlePaymentFailed(bookingId)
          console.log(`[Stripe Webhook] Payment failed handled for booking: ${bookingId}`)
        } else {
          console.warn('[Stripe Webhook] checkout.session.expired missing bookingId in metadata')
        }
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Stripe Webhook] Error processing ${event.type}: ${message}`)
    // Return 200 anyway to prevent Stripe from retrying
  }

  return NextResponse.json({ received: true })
}
