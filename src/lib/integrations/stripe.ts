import Stripe from 'stripe'
import { updateResident, getSettings } from '@/lib/firebase/db'

// Platform Stripe instance (Neighbri's account — for subscription billing)
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    })
  }
  return _stripe
}

export { getStripe as stripe }

// Per-community Stripe instance (for booking payments)
const communityStripeCache = new Map<string, Stripe>()

export function getCommunityStripe(secretKey: string): Stripe {
  let instance = communityStripeCache.get(secretKey)
  if (!instance) {
    instance = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    })
    communityStripeCache.set(secretKey, instance)
  }
  return instance
}

export async function getOrCreateCustomer(
  resident: {
    id: string
    email: string
    name: string
    stripeCustomerId: string | null
  },
  communityId?: string,
): Promise<string> {
  if (resident.stripeCustomerId) return resident.stripeCustomerId

  console.log(`[Stripe] Creating customer for: ${resident.email}`)

  // Use community's Stripe account if available, otherwise platform
  let stripe: Stripe
  if (communityId) {
    const settings = await getSettings(communityId)
    stripe = settings.stripeSecretKey
      ? getCommunityStripe(settings.stripeSecretKey)
      : getStripe()
  } else {
    stripe = getStripe()
  }

  const customer = await stripe.customers.create({
    email: resident.email,
    name: resident.name,
    metadata: { residentId: resident.id },
  })

  await updateResident(resident.id, { stripeCustomerId: customer.id })

  return customer.id
}

export async function createPaymentLink(
  bookingId: string,
  rentalFee: number,
  depositAmount: number,
  customerId: string,
  communityId?: string,
): Promise<string> {
  console.log(`[Stripe] Creating checkout session for booking: ${bookingId}`)

  // Use community's Stripe account if available
  let stripe: Stripe
  if (communityId) {
    const settings = await getSettings(communityId)
    stripe = settings.stripeSecretKey
      ? getCommunityStripe(settings.stripeSecretKey)
      : getStripe()
  } else {
    stripe = getStripe()
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []

  if (rentalFee > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Rental Fee' },
        unit_amount: Math.round(rentalFee * 100),
      },
      quantity: 1,
    })
  }

  if (depositAmount > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Security Deposit' },
        unit_amount: Math.round(depositAmount * 100),
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: lineItems,
    metadata: { bookingId },
    success_url: `${appUrl}/resident/bookings?success=true`,
    cancel_url: `${appUrl}/resident/bookings?cancelled=true`,
  })

  return session.url!
}

export async function issueRefund(
  paymentIntentId: string,
  amount?: number,
  communityId?: string,
): Promise<void> {
  console.log(
    `[Stripe] Issuing ${amount ? 'partial' : 'full'} refund for: ${paymentIntentId}`,
  )

  let stripe: Stripe
  if (communityId) {
    const settings = await getSettings(communityId)
    stripe = settings.stripeSecretKey
      ? getCommunityStripe(settings.stripeSecretKey)
      : getStripe()
  } else {
    stripe = getStripe()
  }

  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount !== undefined) {
    params.amount = Math.round(amount * 100)
  }

  await stripe.refunds.create(params)
}
