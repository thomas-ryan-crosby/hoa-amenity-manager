import Stripe from 'stripe'
import { updateResident } from '@/lib/firebase/db'

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

export async function getOrCreateCustomer(resident: {
  id: string
  email: string
  name: string
  stripeCustomerId: string | null
}): Promise<string> {
  if (resident.stripeCustomerId) return resident.stripeCustomerId

  console.log(`[Stripe] Creating customer for: ${resident.email}`)

  const stripe = getStripe()
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
): Promise<string> {
  console.log(`[Stripe] Creating checkout session for booking: ${bookingId}`)

  const stripe = getStripe()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Rental Fee' },
          unit_amount: Math.round(rentalFee * 100),
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Security Deposit' },
          unit_amount: Math.round(depositAmount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { bookingId },
    success_url: `${appUrl}/bookings?success=true`,
    cancel_url: `${appUrl}/bookings?cancelled=true`,
  })

  return session.url!
}

export async function issueRefund(
  paymentIntentId: string,
  amount?: number,
): Promise<void> {
  console.log(
    `[Stripe] Issuing ${amount ? 'partial' : 'full'} refund for: ${paymentIntentId}`,
  )

  const stripe = getStripe()
  const params: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount !== undefined) {
    params.amount = Math.round(amount * 100)
  }

  await stripe.refunds.create(params)
}
