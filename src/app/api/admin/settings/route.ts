import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { getSettings, updateSettings } from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

const SettingsSchema = z.object({
  pmEmail: z.string().email().optional(),
  orgName: z.string().min(1).optional(),
  defaultAmenityId: z.string().nullable().optional(),
})

export async function GET() {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const communityId = await getActiveCommunityId()
  const settings = await getSettings(communityId ?? undefined)
  return NextResponse.json({
    settings: {
      pmEmail: settings.pmEmail,
      orgName: settings.orgName,
    },
  })
}

export async function PUT(req: NextRequest) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const body = await req.json().catch(() => null)
  const parsed = SettingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid settings', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const communityIdForUpdate = await getActiveCommunityId()
  await updateSettings(parsed.data, communityIdForUpdate ?? undefined)
  return NextResponse.json({ success: true })
}
