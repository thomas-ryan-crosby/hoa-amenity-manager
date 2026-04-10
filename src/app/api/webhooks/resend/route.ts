import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createSupportTicket } from '@/lib/firebase/db'

/**
 * Resend inbound email webhook.
 *
 * Resend sends a POST with the email.received event when someone
 * emails support@neighbri.com (or any @neighbri.com address).
 *
 * Configure in Resend dashboard: Webhooks > Add > email.received
 * URL: https://neighbri.com/api/webhooks/resend
 */

export async function POST(req: NextRequest) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = payload.type as string
  if (type !== 'email.received') {
    // Ignore non-inbound events
    return NextResponse.json({ ok: true })
  }

  const data = payload.data as Record<string, unknown>
  const emailId = (data.email_id ?? '') as string
  const from = (data.from ?? '') as string
  const to = (data.to ?? []) as string[]
  const cc = (data.cc ?? []) as string[]
  const subject = (data.subject ?? '(no subject)') as string

  // Fetch the full email content via Resend API
  let body = ''
  if (emailId && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const email = await resend.emails.get(emailId)
      if (email.data) {
        const emailData = email.data as unknown as Record<string, unknown>
        body = (emailData.text as string) ?? (emailData.html as string) ?? ''
      }
    } catch (err) {
      console.error('[Resend Webhook] Failed to fetch email body:', err)
    }
  }

  // Create support ticket
  try {
    await createSupportTicket({
      emailId,
      from,
      to,
      cc,
      subject,
      body,
      status: 'open',
      notes: '',
      receivedAt: new Date(),
      updatedAt: new Date(),
    })
    console.log(`[Resend Webhook] Ticket created for email from ${from}: ${subject}`)
  } catch (err) {
    console.error('[Resend Webhook] Failed to create ticket:', err)
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
