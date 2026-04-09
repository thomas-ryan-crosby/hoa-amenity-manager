import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-emerald-700 hover:text-emerald-900">&larr; Back to home</Link>
        <h1 className="mt-4 text-3xl font-bold text-stone-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: April 9, 2026</p>

        <div className="mt-8 prose prose-stone prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-stone-600 [&_p]:leading-relaxed [&_li]:text-stone-600">
          <p>
            This Privacy Policy describes how CrumbLabz LLC (&quot;CrumbLabz&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
            collects, uses, and protects your personal information when you use the Neighbri platform
            (&quot;Service&quot;). By using the Service, you consent to the practices described in this policy.
          </p>

          <h2>1. Information We Collect</h2>

          <p><strong>Account information:</strong> When you create an account, we collect your name,
            email address, and optionally your phone number and unit/address. This information is
            required to identify you within your community and facilitate bookings.</p>

          <p><strong>Booking information:</strong> When you make a booking, we collect details about
            the reservation including the amenity, date, time, guest count, and any notes you provide.</p>

          <p><strong>Payment information:</strong> Payments are processed by Stripe. We do not store
            your credit card number, CVV, or full card details. Stripe provides us with a transaction
            reference and payment status. For more information, see
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Stripe&apos;s Privacy Policy</a>.</p>

          <p><strong>Usage data:</strong> We automatically collect information about how you interact
            with the Service, including pages visited, features used, and booking activity. This helps
            us improve the platform.</p>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and operate the Service</li>
            <li>Process and manage your bookings</li>
            <li>Send booking confirmations, reminders, and status updates via email</li>
            <li>Allow community administrators to manage memberships and approvals</li>
            <li>Process payments and refunds through Stripe</li>
            <li>Provide community usage insights to administrators</li>
            <li>Respond to your inquiries and provide support</li>
            <li>Improve and develop new features for the Service</li>
          </ul>

          <h2>3. Information Sharing</h2>
          <p>We share your information only in the following circumstances:</p>
          <ul>
            <li><strong>Community administrators:</strong> Your name, email, unit number, and booking
              details are visible to administrators of communities you belong to. This is necessary
              for them to manage bookings and community membership.</li>
            <li><strong>Other community members:</strong> Your name may appear on the community booking
              calendar unless you choose to book anonymously.</li>
            <li><strong>Service providers:</strong> We use third-party services to operate the platform:
              <ul>
                <li><strong>Firebase (Google)</strong> &mdash; authentication and database</li>
                <li><strong>Stripe</strong> &mdash; payment processing</li>
                <li><strong>Resend</strong> &mdash; email delivery</li>
                <li><strong>Vercel</strong> &mdash; hosting and infrastructure</li>
              </ul>
              These providers process data on our behalf and are bound by their own privacy policies.
            </li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law,
              court order, or governmental regulation.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>

          <h2>4. Cookies</h2>
          <p>We use the following cookies:</p>
          <ul>
            <li><strong>__session:</strong> An authentication cookie that keeps you signed in. This is
              essential for the Service to function and cannot be disabled.</li>
            <li><strong>__activeCommunity:</strong> Stores your currently selected community so the
              platform shows the correct data. This is essential for multi-community functionality.</li>
          </ul>
          <p>
            We do not use advertising cookies, tracking pixels, or third-party analytics cookies.
          </p>

          <h2>5. Data Retention</h2>
          <p>
            We retain your account information for as long as your account is active. Booking records
            are retained for community record-keeping purposes. If you request account deletion, we
            will remove your personal information within 30 days, except where retention is required
            by law or for legitimate business purposes (e.g., financial records).
          </p>

          <h2>6. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your information, including:
          </p>
          <ul>
            <li>Encrypted data transmission (HTTPS/TLS)</li>
            <li>Firebase Authentication with secure session cookies</li>
            <li>Firestore security rules restricting direct database access</li>
            <li>Stripe PCI-compliant payment processing</li>
            <li>Role-based access controls limiting who can view your data</li>
          </ul>
          <p>
            No system is perfectly secure. While we take reasonable precautions, we cannot guarantee
            the absolute security of your information.
          </p>

          <h2>7. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your personal information</li>
            <li>Object to or restrict certain processing of your data</li>
            <li>Export your data in a portable format</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at
            <a href="mailto:support@neighbri.com" className="text-emerald-600 underline">support@neighbri.com</a>.
            We will respond within 30 days.
          </p>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for use by individuals under the age of 13. We do not
            knowingly collect personal information from children under 13. If we become aware that
            we have collected such information, we will take steps to delete it.
          </p>

          <h2>9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will
            notify you by email or through the Service. Your continued use of the Service after
            changes are posted constitutes your acceptance of the updated policy.
          </p>

          <h2>10. Contact</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, contact us at:
          </p>
          <p>
            CrumbLabz LLC<br />
            Email: <a href="mailto:support@neighbri.com" className="text-emerald-600 underline">support@neighbri.com</a>
          </p>
        </div>
      </div>
    </main>
  )
}
