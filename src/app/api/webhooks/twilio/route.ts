import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  await req.formData()
  // TODO: Handle inbound SMS responses
  console.log('Twilio webhook received')
  return NextResponse.json({ received: true })
}
