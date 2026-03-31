import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: Buffer; mimeType?: string }>
}

let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    if (process.env.SMTP_HOST) {
      _transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    } else {
      // Fallback: ethereal (catches all email in dev) or just log
      _transporter = nodemailer.createTransport({
        jsonTransport: true,
      })
    }
  }
  return _transporter
}

export async function sendEmail(options: EmailOptions): Promise<string> {
  const from = process.env.EMAIL_FROM ?? 'bookings@sanctuaryhoa.org'

  if (process.env.DRY_RUN === 'true') {
    console.log(`[Email DRY_RUN] To: ${options.to}, Subject: ${options.subject}`)
    return 'dry-run-message-id'
  }

  const transporter = getTransporter()

  const mailOptions: nodemailer.SendMailOptions = {
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  }

  if (options.attachments?.length) {
    mailOptions.attachments = options.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.mimeType,
    }))
  }

  const info = await transporter.sendMail(mailOptions)

  // If using jsonTransport (no SMTP configured), log the email
  if (!process.env.SMTP_HOST) {
    console.log(`[Email] To: ${options.to}, Subject: ${options.subject}`)
    console.log(`[Email] Message logged (no SMTP configured)`)
  }

  return info.messageId ?? 'sent'
}
