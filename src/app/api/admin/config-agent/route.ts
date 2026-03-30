import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireRole } from '@/lib/auth'
import { handleConfigMessage } from '@/lib/agents/config-agent'

const ConfigMessageSchema = z.object({
  message: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) {
    return authState.response
  }

  const body = await req.json().catch(() => null)
  const parsed = ConfigMessageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Message is required',
        code: 'VALIDATION_ERROR',
        details: parsed.error.flatten(),
      },
      { status: 400 },
    )
  }

  const message = await handleConfigMessage(parsed.data.message)
  return NextResponse.json({ message })
}
