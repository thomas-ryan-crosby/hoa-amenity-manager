import { Resend } from 'resend'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

export async function sendEmail(options: EmailOptions): Promise<string> {
  const from = process.env.EMAIL_FROM ?? 'Sanctuary Booking <bookings@sanctuaryhoa.org>'

  if (process.env.DRY_RUN === 'true') {
    console.log(`[Email DRY_RUN] To: ${options.to}, Subject: ${options.subject}`)
    return 'dry-run-message-id'
  }

  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] No RESEND_API_KEY set. To: ${options.to}, Subject: ${options.subject}`)
    return 'no-api-key'
  }

  console.log(`[Email] Sending via Resend: from=${from}, to=${options.to}, subject="${options.subject}"`)

  const { data, error } = await getResend().emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })

  if (error) {
    console.error(`[Email] Resend error:`, JSON.stringify(error))
    throw new Error(`Resend error: ${error.message}`)
  }

  console.log(`[Email] Sent successfully: id=${data?.id}`)
  return data?.id ?? 'sent'
}
