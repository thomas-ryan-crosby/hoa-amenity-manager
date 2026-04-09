import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-stone-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-emerald-700 hover:text-emerald-900">&larr; Back to home</Link>
        <h1 className="mt-4 text-3xl font-bold text-stone-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-stone-500">Last updated: April 9, 2026</p>

        <div className="mt-8 prose prose-stone prose-sm max-w-none [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-stone-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-stone-600 [&_p]:leading-relaxed [&_li]:text-stone-600">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of the Neighbri platform (&quot;Service&quot;),
            operated by CrumbLabz LLC (&quot;CrumbLabz&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By creating an account or
            using the Service, you agree to be bound by these Terms.
          </p>

          <h2>1. About the Service</h2>
          <p>
            Neighbri is a community amenity booking platform developed and operated by CrumbLabz LLC.
            The Service allows homeowner association (HOA) communities and similar residential
            organizations to manage amenity reservations, process payments, and communicate with residents.
          </p>

          <h2>2. Accounts</h2>
          <p>
            You must create an account to use the Service. You are responsible for maintaining the
            security of your account credentials and for all activities that occur under your account.
            You must provide accurate and complete information when creating your account.
          </p>
          <p>
            Account access within a community is subject to approval by the community&apos;s administrator.
            We reserve the right to suspend or terminate accounts that violate these Terms.
          </p>

          <h2>3. Community Administrators</h2>
          <p>
            Each community on Neighbri has one or more administrators who manage amenity configurations,
            approve or deny membership requests, and oversee bookings. Community administrators are
            responsible for the accuracy of their community&apos;s settings, pricing, and policies.
          </p>
          <p>
            CrumbLabz is not responsible for decisions made by community administrators, including
            booking approvals, denials, or community-specific rules and fees.
          </p>

          <h2>4. Bookings and Payments</h2>
          <p>
            When you submit a booking request, it may be subject to availability, administrator approval,
            and payment processing. Booking confirmations are not guaranteed until you receive a
            confirmation email.
          </p>
          <p>
            Payments for amenity bookings are processed through Stripe, a third-party payment processor.
            By making a payment, you also agree to Stripe&apos;s terms of service. CrumbLabz does not store
            your credit card information directly.
          </p>
          <p>
            Refund policies are set by each community&apos;s administrator and are displayed during the
            booking process. Refunds, when applicable, are processed to your original payment method
            and typically appear within 5&ndash;10 business days.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
            <li>Submit false or misleading information</li>
            <li>Use the Service to harass, abuse, or harm others</li>
            <li>Scrape, copy, or redistribute content from the Service without permission</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The Neighbri platform, including its design, code, features, and branding, is owned by
            CrumbLabz LLC and protected by applicable intellectual property laws. You may not copy,
            modify, distribute, or create derivative works from the Service without our written consent.
          </p>

          <h2>7. Privacy</h2>
          <p>
            Your use of the Service is also governed by our <Link href="/privacy" className="text-emerald-600 underline">Privacy Policy</Link>,
            which describes how we collect, use, and protect your personal information.
          </p>

          <h2>8. Disclaimer of Warranties</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either
            express or implied, including but not limited to implied warranties of merchantability,
            fitness for a particular purpose, and non-infringement. CrumbLabz does not warrant that
            the Service will be uninterrupted, error-free, or secure.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, CrumbLabz LLC shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of profits, revenue,
            data, or use, arising out of or related to your use of the Service. Our total liability
            for any claim arising from these Terms or the Service shall not exceed the amount you paid
            to us in the twelve (12) months preceding the claim.
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless CrumbLabz LLC, its officers, employees, and agents
            from any claims, damages, losses, or expenses (including reasonable legal fees) arising from
            your use of the Service or violation of these Terms.
          </p>

          <h2>11. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. If we make material changes, we will notify
            you by email or through the Service. Your continued use of the Service after changes are
            posted constitutes your acceptance of the updated Terms.
          </p>

          <h2>12. Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without cause,
            and with or without notice. You may also delete your account at any time by contacting us.
            Upon termination, your right to use the Service ceases immediately.
          </p>

          <h2>13. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Texas, without regard to its conflict
            of law provisions. Any disputes arising from these Terms shall be resolved in the courts
            located in Texas.
          </p>

          <h2>14. Contact</h2>
          <p>
            If you have questions about these Terms, contact us at:
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
