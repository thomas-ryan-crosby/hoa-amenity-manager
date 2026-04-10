import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireSuperAdmin } from '../communities/route'
import { getSupportTickets, updateSupportTicket } from '@/lib/firebase/db'

// ---------------------------------------------------------------------------
// GET — list all support tickets
// ---------------------------------------------------------------------------

export async function GET() {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const tickets = await getSupportTickets()

  return NextResponse.json({
    tickets: tickets.map((t) => ({
      ...t,
      receivedAt: t.receivedAt instanceof Date ? t.receivedAt.toISOString() : t.receivedAt,
      updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    })),
  })
}

// ---------------------------------------------------------------------------
// PUT — update ticket status or notes
// ---------------------------------------------------------------------------

const UpdateSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  notes: z.string().optional(),
})

export async function PUT(req: NextRequest) {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return auth.response

  const body = await req.json().catch(() => null)
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { id, ...update } = parsed.data
  await updateSupportTicket(id, update)

  return NextResponse.json({ success: true })
}
