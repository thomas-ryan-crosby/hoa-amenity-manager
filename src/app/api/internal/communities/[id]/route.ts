import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '../route'
import {
  getCommunityById,
  getCommunityMembers,
  updateCommunity,
  deleteCommunity,
} from '@/lib/firebase/db'

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const UpdateCommunitySchema = z.object({
  name: z.string().min(2).optional(),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes')
    .optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zip: z.string().min(5).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().nullable().optional(),
  plan: z.enum(['free', 'standard', 'premium']).optional(),
  maxAmenities: z.number().int().positive().optional(),
  maxMembers: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// GET — community detail with members
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  const community = await getCommunityById(id)
  if (!community) {
    return NextResponse.json(
      { error: 'Community not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  const members = await getCommunityMembers(id)

  return NextResponse.json({
    community: { ...community, members },
  })
}

// ---------------------------------------------------------------------------
// PUT — update community
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  const body = await req.json().catch(() => null)
  const parsed = UpdateCommunitySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid update payload',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const existing = await getCommunityById(id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Community not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  await updateCommunity(id, parsed.data)
  const updated = await getCommunityById(id)
  const members = await getCommunityMembers(id)

  return NextResponse.json({
    community: updated ? { ...updated, members } : null,
  })
}

// ---------------------------------------------------------------------------
// DELETE — soft-delete community (set isActive: false)
// ---------------------------------------------------------------------------

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const { id } = await params

  const existing = await getCommunityById(id)
  if (!existing) {
    return NextResponse.json(
      { error: 'Community not found', code: 'NOT_FOUND' },
      { status: 404 },
    )
  }

  await deleteCommunity(id)

  return NextResponse.json({ ok: true })
}
