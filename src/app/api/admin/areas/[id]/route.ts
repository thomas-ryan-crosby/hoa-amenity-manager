import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { updateArea, deleteArea } from '@/lib/firebase/db'

const AreaUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sortOrder: z.number().int().min(0).optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = AreaUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid area payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  await updateArea(id, parsed.data)

  return NextResponse.json({ success: true, id, ...parsed.data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const { id } = await params
  await deleteArea(id)

  return NextResponse.json({ success: true })
}
