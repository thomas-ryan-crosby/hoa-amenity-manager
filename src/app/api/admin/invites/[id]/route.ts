import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { deactivateInvite } from '@/lib/firebase/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(['property_manager'])
  if (!auth.ok) return auth.response

  const { id } = await params
  const body = await req.json().catch(() => null)

  if (body?.isActive === false) {
    await deactivateInvite(id)
  }

  return NextResponse.json({ success: true })
}
