import twilio from 'twilio'

/**
 * Send an SMS via the Twilio REST API.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID  — Twilio account SID
 *   TWILIO_AUTH_TOKEN    — Twilio auth token
 *   TWILIO_PHONE_NUMBER  — Sending phone number (E.164 format)
 *
 * Supports DRY_RUN env var — when set to 'true', logs instead of sending.
 * Warns if the message body exceeds 160 characters.
 * Throws on failure.
 */
export async function sendSMS(to: string, body: string): Promise<void> {
  if (body.length > 160) {
    console.warn(
      `[Twilio] SMS body exceeds 160 characters (${body.length}). Message may be split into multiple segments.`,
    )
  }

  if (process.env.DRY_RUN === 'true') {
    console.log(`[Twilio DRY_RUN] To: ${to}, Body: ${body}`)
    return
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken) {
    throw new Error(
      'Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables',
    )
  }
  if (!fromNumber) {
    throw new Error('Missing TWILIO_PHONE_NUMBER environment variable')
  }

  const client = twilio(accountSid, authToken)

  try {
    const message = await client.messages.create({
      to,
      from: fromNumber,
      body,
    })

    console.log(`[Twilio] Sent SMS ${message.sid} to ${to}`)
  } catch (error) {
    console.error(`[Twilio] Failed to send SMS to ${to}:`, error)
    throw error
  }
}
