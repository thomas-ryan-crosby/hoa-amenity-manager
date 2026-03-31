import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { getAllStaff, createStaff } from '@/lib/firebase/db'

const StaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  role: z.enum(['PROPERTY_MANAGER', 'JANITORIAL']),
})

export async function GET() {
  const authState = await requireRole(['property_manager', 'board'])
  if (!authState.ok) {
    return authState.response
  }

  const staff = await getAllStaff()

  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const body = await req.json().catch(() => null)
  const parsed = StaffSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid staff payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const staff = await createStaff({
    ...parsed.data,
    phone: parsed.data.phone ?? null,
  })

  return NextResponse.json({ staff }, { status: 201 })
}
