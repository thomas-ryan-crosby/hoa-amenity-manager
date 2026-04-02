export default function TechnologyPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600 mb-3">
            Technology Overview
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 mb-4">
            How Neighbri Works
          </h1>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            A serverless amenity-booking platform built on Next.js, Firebase, Stripe, and Resend
            &mdash; with a state-machine orchestrator that handles every booking from inquiry to close.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-12 space-y-16">

        {/* ------------------------------------------------------------------ */}
        {/* 1. Architecture Overview */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="1" title="Architecture Overview" />
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 overflow-x-auto">
            <div className="min-w-[600px] flex flex-col items-center gap-6">
              {/* Top row - client */}
              <div className="flex items-center gap-4">
                <ArchBox color="stone" label="Browser / Mobile" sub="React 19 + Tailwind" />
              </div>
              <Arrow />
              {/* Middle row - server */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <ArchBox color="emerald" label="Next.js 16 on Vercel" sub="App Router, Serverless" />
              </div>
              <div className="flex items-center gap-3">
                <Arrow />
              </div>
              {/* Bottom row - services */}
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <ArchBox color="amber" label="Firebase Auth" sub="Session cookies + claims" />
                <ArchBox color="amber" label="Firestore" sub="Document database" />
                <ArchBox color="violet" label="Stripe" sub="Checkout + Webhooks" />
                <ArchBox color="sky" label="Resend" sub="Transactional email" />
                <ArchBox color="rose" label="Vercel Cron" sub="Hourly scheduled jobs" />
              </div>
            </div>
            <p className="text-xs text-stone-400 text-center mt-6">
              No Redis. No Google Calendar. No Twilio. The entire stack is serverless with zero
              always-on infrastructure.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 2. Booking Lifecycle */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="2" title="Booking Lifecycle" />
          <p className="text-stone-500 mb-6">
            Every booking passes through a deterministic state machine managed by the orchestrator.
            Status transitions are recorded in an immutable audit log.
          </p>
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 overflow-x-auto">
            <div className="min-w-[500px] flex flex-col items-center gap-0">
              <StatusBadge status="INQUIRY_RECEIVED" color="stone" />
              <Arrow />
              <StatusBadge status="AVAILABILITY_CHECKING" color="stone" />
              {/* Branch */}
              <div className="w-px h-4 bg-stone-300" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {/* Conflict branch */}
                <div className="flex flex-col items-center gap-0 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Conflict</p>
                  <StatusBadge status="WAITLISTED" color="amber" />
                  <p className="text-[11px] text-amber-600 mt-2 text-center">Auto-promotes when slot opens</p>
                </div>
                {/* Blackout / advance exceeded */}
                <div className="flex flex-col items-center gap-0 rounded-2xl bg-red-50 border border-red-200 p-4">
                  <p className="text-xs font-semibold text-red-700 mb-2">Blackout / Too Far Out</p>
                  <StatusBadge status="DENIED" color="red" />
                </div>
                {/* Available */}
                <div className="flex flex-col items-center gap-0 rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-xs font-semibold text-emerald-700 mb-2">Available</p>
                  <p className="text-[11px] text-emerald-600 text-center">Continues below</p>
                </div>
              </div>

              {/* Approval branch */}
              <div className="w-px h-6 bg-stone-300" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-stone-50 border border-stone-200 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Needs Approval</p>
                  <StatusBadge status="PENDING_APPROVAL" color="amber" />
                  <Arrow />
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="flex flex-col items-center">
                      <p className="text-[11px] text-emerald-600 font-medium">Approved + Free</p>
                      <StatusBadge status="CONFIRMED" color="emerald" size="sm" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[11px] text-violet-600 font-medium">Approved + Paid</p>
                      <StatusBadge status="PAYMENT_PENDING" color="violet" size="sm" />
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-[11px] text-red-500 font-medium text-center">PM Denies</p>
                    <StatusBadge status="DENIED" color="red" size="sm" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-stone-50 border border-stone-200 p-4">
                  <p className="text-xs font-semibold text-stone-600 mb-1">Auto-Approved</p>
                  <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="flex flex-col items-center">
                      <p className="text-[11px] text-emerald-600 font-medium">Free / Waived</p>
                      <StatusBadge status="CONFIRMED" color="emerald" size="sm" />
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[11px] text-violet-600 font-medium">Paid</p>
                      <StatusBadge status="PAYMENT_PENDING" color="violet" size="sm" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Post-confirmation */}
              <div className="w-px h-6 bg-stone-300" />
              <p className="text-xs text-stone-400 mb-1">After payment or free confirmation</p>
              <StatusBadge status="CONFIRMED" color="emerald" />
              <Arrow />
              <StatusBadge status="REMINDER_SENT" color="sky" />
              <p className="text-[11px] text-stone-400">48-hour cron</p>
              <Arrow />
              <StatusBadge status="COMPLETED" color="stone" />
              <p className="text-[11px] text-stone-400">Post-event cron (2hrs after end)</p>
              <div className="w-px h-4 bg-stone-300" />
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-emerald-50 border border-emerald-200 p-3">
                  <p className="text-[11px] text-emerald-700 font-medium">Inspection PASS</p>
                  <StatusBadge status="CLOSED" color="emerald" size="sm" />
                  <p className="text-[10px] text-emerald-600">Deposit released</p>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-2xl bg-red-50 border border-red-200 p-3">
                  <p className="text-[11px] text-red-700 font-medium">Inspection FLAG</p>
                  <StatusBadge status="DISPUTE" color="red" size="sm" />
                </div>
              </div>

              {/* Cancellation */}
              <div className="mt-6 rounded-2xl bg-stone-100 border border-stone-300 p-4 w-full max-w-md">
                <p className="text-xs font-semibold text-stone-600 text-center mb-1">Any active status</p>
                <div className="flex flex-col items-center">
                  <StatusBadge status="CANCELLED" color="stone" />
                  <p className="text-[11px] text-stone-500 mt-1 text-center">
                    Refund per policy (full / partial / none) + waitlist promotion
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 3. Email Notifications */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="3" title="Email Notifications" />
          <p className="text-stone-500 mb-6">
            All transactional email is sent via Resend. Cron-based emails run hourly via Vercel Cron.
          </p>
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-3 font-semibold text-stone-700">Trigger</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Email</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Recipient</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Timing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <EmailRow trigger="Sign up" email="Welcome (pending approval)" recipient="New user" timing="Immediate" />
                  <EmailRow trigger="PM approves account" email="Account approved" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="PM denies account" email="Account denied" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="Booking submitted" email="Booking received" recipient="Resident (+bookee if opted in)" timing="Immediate" />
                  <EmailRow trigger="Slot occupied" email="Waitlisted notice" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="Promoted from waitlist" email="Promotion notice" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="Needs PM approval" email="Approval request (JWT links)" recipient="PM" timing="Immediate" />
                  <EmailRow trigger="PM denies booking" email="Denial + reason" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="Payment ready" email="Stripe payment link" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="Payment failed" email="Payment nudge" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="Booking confirmed" email="Confirmation" recipient="Resident (+bookee)" timing="Immediate" />
                  <EmailRow trigger="Booking cancelled" email="Cancellation + refund info" recipient="Resident" timing="Immediate" />
                  <EmailRow trigger="48hrs before event" email="48-hour reminder" recipient="Resident" timing="Cron (hourly)" highlight />
                  <EmailRow trigger="1hr before event" email="Access instructions" recipient="Resident (+bookee)" timing="Cron (hourly)" highlight />
                  <EmailRow trigger="2hrs after event" email="Post-event follow-up" recipient="Resident" timing="Cron (hourly)" highlight />
                  <EmailRow trigger="2hrs after event" email="Inspection reminder" recipient="Janitorial" timing="Cron (hourly)" highlight />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 4. Roles & Permissions */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="4" title="Roles &amp; Permissions" />
          <p className="text-stone-500 mb-6">
            Four roles enforced by Firebase custom claims and proxy middleware.
          </p>
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-3 font-semibold text-stone-700">Capability</th>
                    <th className="px-4 py-3 font-semibold text-stone-700 text-center">Resident</th>
                    <th className="px-4 py-3 font-semibold text-stone-700 text-center">PM</th>
                    <th className="px-4 py-3 font-semibold text-stone-700 text-center">Janitorial</th>
                    <th className="px-4 py-3 font-semibold text-stone-700 text-center">Board</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <PermRow cap="Browse calendar" r="yes" pm="yes" j="yes" b="yes" />
                  <PermRow cap="Submit bookings" r="yes" rNote="if approved" pm="yes" pmNote="+ on behalf" j="no" b="no" />
                  <PermRow cap="Book anonymously" r="yes" pm="yes" j="no" b="no" />
                  <PermRow cap="View own bookings" r="yes" pm="yes" j="no" b="no" />
                  <PermRow cap="See who booked (public calendar)" r="masked" pm="yes" j="yes" b="yes" />
                  <PermRow cap="Accept booking rules" r="yes" pm="waived" j="no" b="no" />
                  <PermRow cap="Approve / deny bookings" r="no" pm="yes" j="no" b="no" />
                  <PermRow cap="Cancel bookings" r="own" pm="any" j="no" b="no" />
                  <PermRow cap="Waive booking fees" r="no" pm="yes" j="no" b="no" />
                  <PermRow cap="Manage amenities / areas" r="no" pm="yes" j="no" b="no" />
                  <PermRow cap="Manage blackout dates" r="no" pm="yes" j="no" b="no" />
                  <PermRow cap="Manage people &amp; roles" r="no" pm="yes" j="no" b="no" />
                  <PermRow cap="System settings" r="no" pm="yes" j="no" b="no" />
                  <PermRow cap="Dashboard calendar" r="no" pm="yes" j="yes" b="no" />
                  <PermRow cap="Drag / resize cleaning windows" r="no" pm="yes" j="yes" b="no" />
                  <PermRow cap="Confirm cleaning windows" r="no" pm="yes" j="yes" b="no" />
                  <PermRow cap="Mark cleaning complete" r="no" pm="yes" j="yes" b="no" />
                  <PermRow cap="Submit inspections" r="no" pm="yes" j="yes" b="no" />
                  <PermRow cap="Config agent (AI)" r="no" pm="yes" j="no" b="no" />
                  <PermRow cap="Personal account settings" r="yes" pm="yes" j="yes" b="yes" />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 5. Tech Stack */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="5" title="Tech Stack" />
          <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-3 font-semibold text-stone-700 w-40">Layer</th>
                    <th className="px-4 py-3 font-semibold text-stone-700">Technology</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <TechRow layer="Frontend" tech="Next.js 16 (App Router), React 19, Tailwind CSS, FullCalendar" />
                  <TechRow layer="Auth" tech="Firebase Auth (email/password, session cookies, custom claims)" />
                  <TechRow layer="Database" tech="Firestore (document DB, real-time capable)" />
                  <TechRow layer="Payments" tech="Stripe Checkout Sessions + Webhooks" />
                  <TechRow layer="Email" tech="Resend (transactional email)" />
                  <TechRow layer="Scheduling" tech="Vercel Cron (hourly job for reminders, access instructions, follow-ups)" />
                  <TechRow layer="AI" tech="Claude API / Anthropic (configuration agent)" />
                  <TechRow layer="Hosting" tech="Vercel (serverless, edge network)" />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 6. Data Model */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="6" title="Data Model" />
          <p className="text-stone-500 mb-6">
            Firestore collections. Each document is identified by an auto-generated ID.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CollectionCard
              name="/residents/{id}"
              fields={['firebaseUid', 'name, email, phone', 'unitNumber', 'status (pending | approved | denied)', 'stripeCustomerId']}
            />
            <CollectionCard
              name="/amenities/{id}"
              fields={['name, description, capacity', 'rentalFee, depositAmount', 'requiresApproval, autoApproveThreshold', 'hasRules, hasAccessInstructions', 'parentAmenityId, suggestedAmenityIds']}
              sub="/blackoutDates/{id}"
            />
            <CollectionCard
              name="/areas/{id}"
              fields={['name', 'sortOrder']}
            />
            <CollectionCard
              name="/bookings/{id}"
              fields={['residentId, amenityId, status', 'startDatetime, endDatetime', 'guestCount, notes, anonymous', 'stripePaymentIntentId, feeWaived', 'bookedByName, sendCommsToBookee']}
              sub="/auditLogs/{id}"
            />
            <CollectionCard
              name="/turnWindows/{id}"
              fields={['bookingId, amenityId, staffId', 'defaultStart, defaultEnd', 'actualStart, actualEnd', 'status (PENDING | SCHEDULED | COMPLETED)']}
            />
            <CollectionCard
              name="/inspectionReports/{bookingId}"
              fields={['staffId', 'status (PASS | FLAG)', 'notes', 'photos[]', 'submittedAt']}
            />
            <CollectionCard
              name="/settings/global"
              fields={['orgName, pmEmail', 'defaultAmenityId', 'approvalJwtSecret']}
            />
            <CollectionCard
              name="/staff/{id}"
              fields={['name, email, phone', 'role (PROPERTY_MANAGER | JANITORIAL)']}
            />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 7. Key Features */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="7" title="Key Features" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard title="Amenity Areas &amp; Ordering" desc="Group amenities into named areas with custom sort order for organized browsing." />
            <FeatureCard title="Parent / Child Blocking" desc="Parent amenities automatically block child amenities for the same time slot." />
            <FeatureCard title="Suggested Pairings" desc='Two-way "also book" prompts during booking encourage residents to reserve related amenities.' />
            <FeatureCard title="Waitlist with Auto-Promotion" desc="Conflicting bookings are waitlisted and automatically promoted when a slot opens." />
            <FeatureCard title="Turn Windows (Drag &amp; Drop)" desc="Janitorial cleaning windows are auto-created and adjustable via drag-and-drop on the dashboard." />
            <FeatureCard title="Fee Waiver" desc="Property managers can waive rental fees on a per-booking basis." />
            <FeatureCard title="Anonymous Bookings" desc="Residents can book anonymously, masking their name on the public calendar." />
            <FeatureCard title="Book on Behalf (PM)" desc="PMs can create bookings for residents or external parties with optional bookee notifications." />
            <FeatureCard title="Booking Rules Acceptance" desc="Amenities can require residents to accept rules before confirming a booking." />
            <FeatureCard title="Access Instructions" desc="Amenity-specific access instructions sent 1 hour before the event via cron." />
            <FeatureCard title="Multi-View Calendar" desc="FullCalendar with month, week, day, and list views. Click a day to zoom into week view." />
            <FeatureCard title="Mobile-Optimized" desc="Bottom-sheet modal pattern for booking on mobile devices with responsive layout throughout." />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* 8. Security */}
        {/* ------------------------------------------------------------------ */}
        <section>
          <SectionHeading number="8" title="Security" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SecurityCard title="Session Cookies" desc="Firebase Auth with 5-day expiry httpOnly session cookies. No tokens in localStorage." />
            <SecurityCard title="Role-Based Access" desc="Firebase custom claims (resident, property_manager, janitorial, board) enforced on every request." />
            <SecurityCard title="Proxy Middleware" desc="Every non-public route is validated by middleware that checks the __session cookie before passing through." />
            <SecurityCard title="Stripe Webhooks" desc="Webhook signature verification ensures payment events are authentic." />
            <SecurityCard title="JWT Approval Links" desc="PM approve/deny email links contain signed JWT tokens with 48-hour expiry." />
            <SecurityCard title="Cron Authentication" desc="Vercel Cron endpoint protected by CRON_SECRET bearer token validation." />
            <SecurityCard title="Input Validation" desc="Zod schema validation on all API route inputs to prevent malformed data." />
            <SecurityCard title="Immutable Audit Logs" desc="All booking state transitions are recorded in append-only audit log entries." />
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="border-t border-stone-200 bg-white mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 text-center">
          <p className="text-sm text-stone-400">
            Built with Next.js 16, Firebase, Stripe, and Resend. Hosted on Vercel.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ========================================================================== */
/* Helper components                                                          */
/* ========================================================================== */

function SectionHeading({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        {number}
      </span>
      <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
    </div>
  )
}

/* Architecture diagram boxes */
const archColors: Record<string, string> = {
  stone: 'bg-stone-100 border-stone-300 text-stone-800',
  emerald: 'bg-emerald-50 border-emerald-300 text-emerald-800',
  amber: 'bg-amber-50 border-amber-300 text-amber-800',
  violet: 'bg-violet-50 border-violet-300 text-violet-800',
  sky: 'bg-sky-50 border-sky-300 text-sky-800',
  rose: 'bg-rose-50 border-rose-300 text-rose-800',
}

function ArchBox({ color, label, sub }: { color: string; label: string; sub: string }) {
  return (
    <div className={`rounded-xl border-2 px-5 py-3 text-center ${archColors[color] ?? archColors.stone}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs opacity-70">{sub}</p>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-4 bg-stone-300" />
      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-stone-400" />
    </div>
  )
}

/* Status badges */
const statusColors: Record<string, string> = {
  stone: 'bg-stone-100 text-stone-700 border-stone-300',
  emerald: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  amber: 'bg-amber-100 text-amber-700 border-amber-300',
  red: 'bg-red-100 text-red-700 border-red-300',
  violet: 'bg-violet-100 text-violet-700 border-violet-300',
  sky: 'bg-sky-100 text-sky-700 border-sky-300',
}

function StatusBadge({ status, color, size = 'md' }: { status: string; color: string; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
  return (
    <span className={`inline-block rounded-full border font-mono font-semibold ${sizeClass} ${statusColors[color] ?? statusColors.stone}`}>
      {status}
    </span>
  )
}

/* Email table row */
function EmailRow({ trigger, email, recipient, timing, highlight }: {
  trigger: string; email: string; recipient: string; timing: string; highlight?: boolean
}) {
  return (
    <tr className={highlight ? 'bg-sky-50/50' : ''}>
      <td className="px-4 py-2.5 text-stone-700">{trigger}</td>
      <td className="px-4 py-2.5 font-medium text-stone-900">{email}</td>
      <td className="px-4 py-2.5 text-stone-600">{recipient}</td>
      <td className="px-4 py-2.5">
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
          timing === 'Immediate'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-sky-100 text-sky-700'
        }`}>
          {timing}
        </span>
      </td>
    </tr>
  )
}

/* Permission table helpers */
function PermCell({ value, note }: { value: string; note?: string }) {
  if (value === 'yes') return <td className="px-4 py-2 text-center text-emerald-600 font-medium">{note ? <span title={note}>&#10003; <span className="text-[10px] text-stone-400">{note}</span></span> : '\u2713'}</td>
  if (value === 'no') return <td className="px-4 py-2 text-center text-stone-300">&mdash;</td>
  // special text values
  return <td className="px-4 py-2 text-center text-xs text-stone-500">{value}</td>
}

function PermRow({ cap, r, pm, j, b, rNote, pmNote }: {
  cap: string; r: string; pm: string; j: string; b: string; rNote?: string; pmNote?: string
}) {
  return (
    <tr>
      <td className="px-4 py-2 text-stone-700">{cap}</td>
      <PermCell value={r} note={rNote} />
      <PermCell value={pm} note={pmNote} />
      <PermCell value={j} />
      <PermCell value={b} />
    </tr>
  )
}

/* Tech stack row */
function TechRow({ layer, tech }: { layer: string; tech: string }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-stone-700">{layer}</td>
      <td className="px-4 py-3 text-stone-600">{tech}</td>
    </tr>
  )
}

/* Collection card */
function CollectionCard({ name, fields, sub }: { name: string; fields: string[]; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <p className="font-mono text-sm font-semibold text-emerald-700 mb-2">{name}</p>
      {sub && <p className="font-mono text-xs text-amber-600 mb-2 -mt-1">&nbsp;&nbsp;{sub}</p>}
      <ul className="space-y-1">
        {fields.map((f, i) => (
          <li key={i} className="text-xs text-stone-500 font-mono">{f}</li>
        ))}
      </ul>
    </div>
  )
}

/* Feature card */
function FeatureCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 hover:border-emerald-300 transition-colors">
      <h3 className="text-sm font-semibold text-stone-900 mb-1">{title}</h3>
      <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
    </div>
  )
}

/* Security card */
function SecurityCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
          &#10003;
        </span>
        <div>
          <h3 className="text-sm font-semibold text-stone-900 mb-1">{title}</h3>
          <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  )
}
