import { NextRequest, NextResponse } from 'next/server'
import { verifyActionToken } from '@/lib/agents/pm-agent'
import * as orchestrator from '@/lib/agents/orchestrator'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const reason =
    new URL(req.url).searchParams.get('reason') ??
    'Denied from email approval link.'

  try {
    const payload = await verifyActionToken(token)

    if (payload.action !== 'deny') {
      throw new Error('Invalid denial token action')
    }

    await orchestrator.handleDenial(payload.bookingId, reason)
    return NextResponse.redirect(new URL('/admin/dashboard?denied=1', req.url))
  } catch {
    return NextResponse.redirect(
      new URL('/admin/dashboard?denialError=1', req.url),
    )
  }
}
