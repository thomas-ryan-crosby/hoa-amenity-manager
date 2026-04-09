import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { adminAuth } from '@/lib/firebase/admin'
import { sendEmail } from '@/lib/integrations/gmail'

const ResetSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = ResetSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  const { email } = parsed.data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://neighbri.com'

  try {
    // Generate the password reset link via Firebase Admin SDK
    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${appUrl}/sign-in`,
    })

    // Send via Resend with Neighbri branding
    await sendEmail({
      to: email,
      subject: 'Reset your Neighbri password',
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
          <p style="color: #059669; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Neighbri</p>
          <h1 style="color: #1c1917; font-size: 24px; margin-top: 8px;">Reset your password</h1>
          <p style="color: #57534e; font-size: 15px; line-height: 1.7;">
            We received a request to reset your password. Click the button below to choose a new one.
          </p>
          <p style="margin: 24px 0;">
            <a href="${resetLink}"
               style="display: inline-block; background: #059669; color: white; padding: 12px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; font-size: 14px;">
              Reset password
            </a>
          </p>
          <p style="color: #78716c; font-size: 13px; line-height: 1.6;">
            This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #a8a29e; font-size: 13px; margin-top: 32px;">
            Neighbri &mdash; Amenity booking for your community
          </p>
        </div>
      `,
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error('[Password Reset]', err)
    // Don't reveal whether the email exists — always return success
    return NextResponse.json({ sent: true })
  }
}
