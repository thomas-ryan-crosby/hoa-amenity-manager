import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { updateStaff, deleteStaff } from '@/lib/firebase/db'

const StaffUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(['PROPERTY_MANAGER', 'JANITORIAL']).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = StaffUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid staff payload', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  await updateStaff(id, parsed.data)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const { id } = await params
  await deleteStaff(id)
  return NextResponse.json({ success: true })
}
