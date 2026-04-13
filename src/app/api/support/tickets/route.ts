import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { adminAuth } from '@/lib/firebase/admin'
import {
  createSupportTicket,
  getResidentByFirebaseUid,
  getCommunityById,
} from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

const CreateTicketSchema = z.object({
  type: z.enum(['bug', 'feature', 'other']),
  message: z.string().min(5).max(5000),
  pageUrl: z.string().optional(),
})

const SUPPORT_INBOX = 'support@neighbri.com'

const TYPE_LABELS: Record<'bug' | 'feature' | 'other', string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  other: 'Feedback',
}

export async function POST(req: NextRequest) {
  const authState = await requireUser()
  if (!authState.ok) return authState.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = CreateTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please enter a message with at least 5 characters.' },
      { status: 400 },
    )
  }

  const { type, message, pageUrl } = parsed.data

  // Gather context about the submitter for the internal ticket
  const [userRecord, resident, communityId] = await Promise.all([
    adminAuth.getUser(authState.userId).catch(() => null),
    getResidentByFirebaseUid(authState.userId).catch(() => null),
    getActiveCommunityId(),
  ])
  const community = communityId
    ? await getCommunityById(communityId).catch(() => null)
    : null

  const email = userRecord?.email ?? resident?.email ?? 'unknown@neighbri.com'
  const displayName = resident?.name ?? userRecord?.displayName ?? email

  const subject = `[${TYPE_LABELS[type]}] ${message.slice(0, 60).replace(/\s+/g, ' ').trim()}${message.length > 60 ? '...' : ''}`

  const metadata = [
    `Submitted by: ${displayName} <${email}>`,
    `Role: ${authState.role ?? 'unknown'}`,
    community ? `Community: ${community.name}` : null,
    pageUrl ? `Page: ${pageUrl}` : null,
    `Type: ${TYPE_LABELS[type]}`,
  ]
    .filter(Boolean)
    .join('\n')

  const ticketBody = `${metadata}\n\n---\n\n${message}`

  const now = new Date()
  const ticket = await createSupportTicket({
    emailId: `in-app-${now.getTime()}-${authState.userId.slice(0, 8)}`,
    from: email,
    to: [SUPPORT_INBOX],
    cc: [],
    subject,
    body: ticketBody,
    status: 'open',
    notes: '',
    receivedAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ ticketId: ticket.id }, { status: 201 })
}
