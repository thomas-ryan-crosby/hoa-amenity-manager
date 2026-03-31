import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { getSettings, updateSettings } from '@/lib/firebase/db'

const SettingsSchema = z.object({
  pmEmail: z.string().email().optional(),
  orgName: z.string().min(1).optional(),
  twilioPhoneNumber: z.string().optional(),
})

export async function GET() {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const settings = await getSettings()
  // Don't expose the JWT secret to the client
  return NextResponse.json({
    settings: {
      pmEmail: settings.pmEmail,
      orgName: settings.orgName,
      twilioPhoneNumber: settings.twilioPhoneNumber,
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

  await updateSettings(parsed.data)
  return NextResponse.json({ success: true })
}
