import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import * as orchestrator from '@/lib/agents/orchestrator'

type ApprovalTokenPayload = {
  bookingId: string
  action: 'approve' | 'deny'
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  try {
    const payload = jwt.verify(
      token,
      process.env.PM_APPROVAL_JWT_SECRET!,
    ) as ApprovalTokenPayload

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
