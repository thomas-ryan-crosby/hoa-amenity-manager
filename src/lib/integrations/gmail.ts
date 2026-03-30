import { google } from 'googleapis'

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: Buffer; mimeType?: string }>
}

/**
 * Build a base64url-encoded RFC 2822 email string suitable for the Gmail API.
 */
function buildRawEmail(options: EmailOptions, from: string): string {
  const boundary = `boundary_${Date.now()}`
  const hasAttachments = options.attachments && options.attachments.length > 0

  const headers = [
    `From: ${from}`,
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    `MIME-Version: 1.0`,
  ]

  let body: string

  if (hasAttachments) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`)
    const parts: string[] = []

    // HTML body part
    parts.push(
      `--${boundary}`,
      `Content-Type: text/html; charset="UTF-8"`,
      `Content-Transfer-Encoding: base64`,
      '',
      Buffer.from(options.html, 'utf-8').toString('base64'),
    )

    // Attachment parts
    for (const att of options.attachments!) {
      const mime = att.mimeType || 'application/octet-stream'
      parts.push(
        `--${boundary}`,
        `Content-Type: ${mime}; name="${att.filename}"`,
        `Content-Disposition: attachment; filename="${att.filename}"`,
        `Content-Transfer-Encoding: base64`,
        '',
        att.content.toString('base64'),
      )
    }

    parts.push(`--${boundary}--`)
    body = parts.join('\r\n')
  } else {
    headers.push(`Content-Type: text/html; charset="UTF-8"`)
    headers.push(`Content-Transfer-Encoding: base64`)
    body = Buffer.from(options.html, 'utf-8').toString('base64')
  }

  const raw = headers.join('\r\n') + '\r\n\r\n' + body

  // Gmail API expects base64url encoding (no padding, + -> -, / -> _)
  return Buffer.from(raw, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Get an authenticated Gmail client using a service account with domain-wide delegation.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_KEY — JSON string of the service account key file
 *   GMAIL_DELEGATED_USER      — The user to impersonate (e.g. bookings@sanctuaryhoa.org)
 */
function getGmailClient() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable')
  }

  const key = JSON.parse(keyJson)
  const delegatedUser =
    process.env.GMAIL_DELEGATED_USER ||
    process.env.GMAIL_FROM_ADDRESS ||
    'bookings@sanctuaryhoa.org'

  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
    subject: delegatedUser,
  })

  return google.gmail({ version: 'v1', auth })
}

/**
 * Send an email via Gmail API using a service account with domain-wide delegation.
 * Supports DRY_RUN env var — when set to 'true', logs instead of sending.
 * Returns the Gmail messageId.
 */
export async function sendEmail(options: EmailOptions): Promise<string> {
  const from =
    process.env.GMAIL_FROM_ADDRESS || 'bookings@sanctuaryhoa.org'

  if (process.env.DRY_RUN === 'true') {
    console.log(
      `[Gmail DRY_RUN] To: ${options.to}, Subject: ${options.subject}`,
    )
    console.log(`[Gmail DRY_RUN] HTML length: ${options.html.length}`)
    return 'dry-run-message-id'
  }

  const gmail = getGmailClient()
  const raw = buildRawEmail(options, from)

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })

  const messageId = response.data.id
  if (!messageId) {
    throw new Error('Gmail API did not return a message ID')
  }

  console.log(`[Gmail] Sent message ${messageId} to ${options.to}`)
  return messageId
}
