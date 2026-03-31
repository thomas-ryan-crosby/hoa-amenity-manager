import { NextRequest, NextResponse } from 'next/server'
import { verifyActionToken } from '@/lib/agents/pm-agent'
import * as orchestrator from '@/lib/agents/orchestrator'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  try {
    const payload = await verifyActionToken(token)

    if (payload.action !== 'approve') {
      throw new Error('Invalid approval token action')
    }

    await orchestrator.handleApproval(payload.bookingId)
    return NextResponse.redirect(
      new URL('/admin/dashboard?approved=1', req.url),
    )
  } catch {
    return NextResponse.redirect(
      new URL('/admin/dashboard?approvalError=1', req.url),
    )
  }
}
