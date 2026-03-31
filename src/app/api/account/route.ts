import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { getResidentByFirebaseUid, updateResident } from '@/lib/firebase/db'

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  unitNumber: z.string().optional(),
})

export async function GET() {
  const authState = await requireUser()
  if (!authState.ok) return authState.response

  const resident = await getResidentByFirebaseUid(authState.userId)
  if (!resident) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    profile: {
      id: resident.id,
      name: resident.name,
      email: resident.email,
      phone: resident.phone,
      unitNumber: resident.unitNumber,
    },
  })
}

export async function PUT(req: NextRequest) {
  const authState = await requireUser()
  if (!authState.ok) return authState.response

  const resident = await getResidentByFirebaseUid(authState.userId)
  if (!resident) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => null)
  const parsed = UpdateProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid profile data', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  await updateResident(resident.id, parsed.data)

  return NextResponse.json({ success: true })
}
