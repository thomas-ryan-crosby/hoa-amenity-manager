import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getBookingWithRelations, getSettings, updateBooking } from '@/lib/firebase/db'
import * as orchestrator from '@/lib/booking/workflow'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const feeWaived = body.feeWaived === true

  // Block approval if billing isn't configured and this is a paid booking
  const { amenity, communityId } = await getBookingWithRelations(id)
  const isPaid = !feeWaived && (amenity.rentalFee > 0 || amenity.depositAmount > 0)
  if (isPaid) {
    const settings = await getSettings(communityId ?? undefined)
    if (settings.billingMode == null) {
      return NextResponse.json(
        {
          error: 'Set up a billing mode (Stripe or offline ledger) in Admin → Billing before approving bookings that have a fee or deposit. Or approve with the fee waived.',
          code: 'BILLING_NOT_CONFIGURED',
        },
        { status: 400 },
      )
    }
    if (settings.billingMode === 'stripe' && !settings.stripeConnected) {
      return NextResponse.json(
        {
          error: 'Stripe billing is selected but keys are incomplete. Finish Stripe setup in Admin → Billing, switch to offline ledger mode, or approve with the fee waived.',
          code: 'STRIPE_NOT_CONNECTED',
        },
        { status: 400 },
      )
    }
  }

  // Allow PM to waive fees at approval time
  if (feeWaived) {
    await updateBooking(id, { feeWaived: true })
  }

  await orchestrator.handleApproval(id)

  return NextResponse.json({ success: true })
}
