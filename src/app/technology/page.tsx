export default function TechnologyPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Sanctuary Booking
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-stone-900 sm:text-5xl">
            System &amp; Technology Overview
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-stone-500">
            A complete look at the architecture, booking lifecycle, agent system,
            and data model powering the HOA amenity booking platform.
          </p>
        </div>

        {/* ================================================================
            SECTION 1: Architecture Overview
            ================================================================ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-stone-900">
            Architecture Overview
          </h2>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
            {/* Client tier */}
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                Clients
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: 'Resident Browser', icon: 'R' },
                  { label: 'Admin Browser', icon: 'A' },
                  { label: 'Janitorial Mobile', icon: 'J' },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-800 text-xs font-bold text-white">
                      {c.icon}
                    </span>
                    <span className="text-sm font-medium text-stone-700">
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrows down */}
            <div className="mb-8 flex justify-center">
              <div className="flex flex-col items-center gap-1 text-stone-400">
                <span className="text-xs tracking-wider">HTTPS</span>
                <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                  <path d="M12 0v26m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* Main app box */}
            <div className="mb-8 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-emerald-700">
                Next.js App &mdash; Vercel (Serverless)
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { name: 'Proxy Middleware', desc: 'Auth guard on every request' },
                  { name: 'API Routes', desc: 'Webhooks, approvals, config' },
                  { name: 'Server Components', desc: 'SSR pages & data loading' },
                  { name: 'Client Components', desc: 'FullCalendar, forms, chat' },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-emerald-800">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrows down */}
            <div className="mb-8 flex justify-center">
              <div className="flex flex-col items-center gap-1 text-stone-400">
                <span className="text-xs tracking-wider">Integrations</span>
                <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
                  <path d="M12 0v26m0 0l-6-6m6 6l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            {/* External services */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-stone-400">
                External Services
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    name: 'Firebase Auth',
                    desc: 'Email/password, session cookies',
                    color: 'border-blue-300 bg-blue-50 text-blue-800',
                  },
                  {
                    name: 'Firestore',
                    desc: 'Document database',
                    color: 'border-blue-300 bg-blue-50 text-blue-800',
                  },
                  {
                    name: 'Stripe',
                    desc: 'Checkout, refunds, deposits',
                    color: 'border-purple-300 bg-purple-50 text-purple-800',
                  },
                  {
                    name: 'Twilio',
                    desc: 'SMS notifications',
                    color: 'border-amber-300 bg-amber-50 text-amber-800',
                  },
                  {
                    name: 'SMTP (Nodemailer)',
                    desc: 'Email notifications',
                    color: 'border-amber-300 bg-amber-50 text-amber-800',
                  },
                  {
                    name: 'Redis + BullMQ',
                    desc: 'Job queue & scheduling',
                    color: 'border-amber-300 bg-amber-50 text-amber-800',
                  },
                  {
                    name: 'Claude API',
                    desc: 'AI config agent (Anthropic)',
                    color: 'border-amber-300 bg-amber-50 text-amber-800',
                  },
                ].map((svc) => (
                  <div
                    key={svc.name}
                    className={`rounded-xl border px-4 py-3 ${svc.color}`}
                  >
                    <p className="text-sm font-semibold">{svc.name}</p>
                    <p className="mt-1 text-xs opacity-70">{svc.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-8 flex flex-wrap gap-4 border-t border-stone-100 pt-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded border-2 border-emerald-400 bg-emerald-100" />
                Main App
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded border-2 border-blue-400 bg-blue-100" />
                Firebase
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded border-2 border-purple-400 bg-purple-100" />
                Stripe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded border-2 border-amber-400 bg-amber-100" />
                External APIs
              </span>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 2: Booking Lifecycle
            ================================================================ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-stone-900">
            Booking Lifecycle
          </h2>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
            <p className="mb-6 text-sm text-stone-500">
              Every booking follows a deterministic state machine managed by the
              Orchestrator Agent. Below is the full lifecycle with all possible
              transitions.
            </p>

            <div className="space-y-0">
              {/* Each step is a row with arrow connectors */}
              {[
                {
                  status: 'INQUIRY_RECEIVED',
                  color: 'bg-stone-100 text-stone-800 border-stone-300',
                  desc: 'Resident submits a booking request',
                  arrow: true,
                },
                {
                  status: 'AVAILABILITY_CHECKING',
                  color: 'bg-sky-100 text-sky-800 border-sky-300',
                  desc: 'System checks for blackout dates, advance booking limits, and time slot conflicts',
                  arrow: true,
                },
              ].map((step) => (
                <div key={step.status} className="flex flex-col items-start">
                  <div
                    className={`inline-flex items-center gap-3 rounded-lg border px-4 py-2.5 ${step.color}`}
                  >
                    <span className="font-mono text-xs font-bold">
                      {step.status}
                    </span>
                  </div>
                  <p className="mt-1.5 pl-1 text-xs text-stone-500">
                    {step.desc}
                  </p>
                  {step.arrow && (
                    <div className="ml-5 flex h-8 items-center text-stone-300">
                      <svg width="2" height="32" viewBox="0 0 2 32">
                        <line x1="1" y1="0" x2="1" y2="32" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {/* Branch: Conflict / No Conflict */}
              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Availability result branches
                </p>

                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Branch A: Conflict */}
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <p className="text-xs font-bold text-orange-700">
                      Conflict found
                    </p>
                    <div className="mt-2">
                      <span className="inline-block rounded border border-orange-300 bg-orange-100 px-2 py-1 font-mono text-xs font-bold text-orange-800">
                        WAITLISTED
                      </span>
                      <p className="mt-1.5 text-xs text-stone-500">
                        Auto-promotes when the blocking booking is cancelled.
                      </p>
                    </div>
                  </div>

                  {/* Branch B: Needs approval */}
                  <div className="rounded-lg border border-violet-200 bg-violet-50 p-4">
                    <p className="text-xs font-bold text-violet-700">
                      No conflict + requires approval
                    </p>
                    <div className="mt-2 space-y-2">
                      <span className="inline-block rounded border border-violet-300 bg-violet-100 px-2 py-1 font-mono text-xs font-bold text-violet-800">
                        PENDING_APPROVAL
                      </span>
                      <p className="text-xs text-stone-500">
                        PM receives email with JWT-signed approve/deny links.
                      </p>
                      <div className="ml-2 space-y-1.5 border-l-2 border-violet-200 pl-3 pt-1">
                        <div>
                          <span className="inline-block rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                            Approved + paid
                          </span>
                          <span className="mx-1 text-xs text-stone-400">
                            &rarr;
                          </span>
                          <span className="font-mono text-xs text-stone-600">
                            PAYMENT_PENDING
                          </span>
                        </div>
                        <div>
                          <span className="inline-block rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                            Approved + free
                          </span>
                          <span className="mx-1 text-xs text-stone-400">
                            &rarr;
                          </span>
                          <span className="font-mono text-xs text-stone-600">
                            CONFIRMED
                          </span>
                        </div>
                        <div>
                          <span className="inline-block rounded border border-red-300 bg-red-100 px-2 py-0.5 font-mono text-[10px] font-bold text-red-800">
                            Denied
                          </span>
                          <span className="mx-1 text-xs text-stone-400">
                            &rarr;
                          </span>
                          <span className="font-mono text-xs text-stone-600">
                            DENIED
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Branch C: Auto-approved */}
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-xs font-bold text-emerald-700">
                      No conflict + auto-approved
                    </p>
                    <div className="mt-2 space-y-2">
                      <div>
                        <span className="inline-block rounded border border-purple-300 bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-800">
                          Paid amenity
                        </span>
                        <span className="mx-1 text-xs text-stone-400">
                          &rarr;
                        </span>
                        <span className="font-mono text-xs text-stone-600">
                          PAYMENT_PENDING &rarr; CONFIRMED
                        </span>
                      </div>
                      <div>
                        <span className="inline-block rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                          Free amenity
                        </span>
                        <span className="mx-1 text-xs text-stone-400">
                          &rarr;
                        </span>
                        <span className="font-mono text-xs text-stone-600">
                          CONFIRMED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment sub-flow */}
              <div className="ml-5 flex h-6 items-center text-stone-300">
                <svg width="2" height="24" viewBox="0 0 2 24">
                  <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>

              <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-purple-600">
                  Payment flow (paid amenities)
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded border border-purple-300 bg-purple-100 px-2 py-1 font-mono text-xs font-bold text-purple-800">
                    PAYMENT_PENDING
                  </span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="text-xs text-stone-500">
                    Stripe Checkout Session
                  </span>
                  <span className="text-stone-400">&rarr;</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600">Success</span>
                      <span className="text-stone-400">&rarr;</span>
                      <span className="rounded border border-emerald-300 bg-emerald-100 px-2 py-1 font-mono text-xs font-bold text-emerald-800">
                        CONFIRMED
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Failed</span>
                      <span className="text-stone-400">&rarr;</span>
                      <span className="rounded border border-red-300 bg-red-100 px-2 py-1 font-mono text-xs font-bold text-red-800">
                        PAYMENT_FAILED
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Post-confirmation flow */}
              <div className="ml-5 flex h-6 items-center text-stone-300">
                <svg width="2" height="24" viewBox="0 0 2 24">
                  <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Post-confirmation lifecycle
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded border border-emerald-300 bg-emerald-100 px-2 py-1 font-mono font-bold text-emerald-800">
                    CONFIRMED
                  </span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="rounded border border-blue-300 bg-blue-100 px-2 py-1 font-mono font-bold text-blue-800">
                    REMINDER_SENT
                  </span>
                  <span className="text-stone-400 max-sm:hidden">
                    (48h before)
                  </span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="rounded border border-indigo-300 bg-indigo-100 px-2 py-1 font-mono font-bold text-indigo-800">
                    IN_PROGRESS
                  </span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="rounded border border-stone-300 bg-stone-100 px-2 py-1 font-mono font-bold text-stone-700">
                    COMPLETED
                  </span>
                </div>
              </div>

              {/* Inspection */}
              <div className="ml-5 flex h-6 items-center text-stone-300">
                <svg width="2" height="24" viewBox="0 0 2 24">
                  <line x1="1" y1="0" x2="1" y2="24" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>

              <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Inspection outcome
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-medium">PASS</span>
                    <span className="text-stone-400">&rarr;</span>
                    <span className="rounded border border-emerald-300 bg-emerald-100 px-2 py-1 font-mono font-bold text-emerald-800">
                      CLOSED
                    </span>
                    <span className="text-stone-500">(deposit released)</span>
                  </div>
                  <span className="text-stone-300">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-medium">FLAG</span>
                    <span className="text-stone-400">&rarr;</span>
                    <span className="rounded border border-red-300 bg-red-100 px-2 py-1 font-mono font-bold text-red-800">
                      DISPUTE
                    </span>
                  </div>
                </div>
              </div>

              {/* Cancellation */}
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50/40 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-red-600">
                  Cancellation (from any active state)
                </p>
                <p className="text-xs text-stone-500">
                  Any active booking can be cancelled. The refund amount is
                  calculated based on the amenity&apos;s cancellation policy
                  (full refund window, partial refund window, or no refund).
                  After cancellation, the next waitlisted booking for the same
                  slot is automatically promoted.
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className="italic text-stone-500">Any active state</span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="rounded border border-red-300 bg-red-100 px-2 py-1 font-mono font-bold text-red-800">
                    CANCELLED
                  </span>
                  <span className="text-stone-400">&rarr;</span>
                  <span className="text-stone-500">
                    refund calculated + waitlist promoted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 3: Agent System
            ================================================================ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-stone-900">
            Agent System
          </h2>
          <p className="mb-6 max-w-3xl text-sm text-stone-500">
            The booking system uses a multi-agent architecture. Each agent is a
            specialized module with a single area of responsibility. The
            orchestrator coordinates between them.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Orchestrator Agent',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                ),
                color: 'border-emerald-200 bg-emerald-50',
                iconBg: 'bg-emerald-600',
                responsibilities: [
                  'Central state machine manager',
                  'Routes tasks to other agents',
                  'Handles availability checks, approvals, payments',
                  'Manages cancellation refund logic',
                  'Promotes bookings from waitlist',
                ],
              },
              {
                name: 'Resident Agent',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                ),
                color: 'border-blue-200 bg-blue-50',
                iconBg: 'bg-blue-600',
                responsibilities: [
                  'All resident-facing notifications',
                  'Email + SMS dual-channel delivery',
                  'Confirmations, reminders, payment links',
                  'Waitlist and denial notifications',
                  'Post-event follow-up messages',
                ],
              },
              {
                name: 'PM Agent',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                ),
                color: 'border-violet-200 bg-violet-50',
                iconBg: 'bg-violet-600',
                responsibilities: [
                  'Sends approval request emails to PM',
                  'JWT-signed approve/deny action links',
                  'Tokens expire after 48 hours',
                  'Per-amenity approver configuration',
                  'Falls back to global PM email',
                ],
              },
              {
                name: 'Janitorial Agent',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.049.58.025 1.193-.14 1.743" />
                  </svg>
                ),
                color: 'border-amber-200 bg-amber-50',
                iconBg: 'bg-amber-600',
                responsibilities: [
                  'Round-robin staff assignment',
                  'Pre-event setup checklists via email',
                  'Post-event inspection reminders via SMS',
                  'Supports manual assignment mode',
                  'Tracks assignments in audit log',
                ],
              },
              {
                name: 'Configuration Agent',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                  </svg>
                ),
                color: 'border-pink-200 bg-pink-50',
                iconBg: 'bg-pink-600',
                responsibilities: [
                  'Claude AI-powered admin assistant',
                  'Natural language amenity configuration',
                  'CRUD operations via tool-use loop',
                  'Manages blackout dates, fees, policies',
                  'Full audit trail of all changes',
                ],
              },
            ].map((agent) => (
              <div
                key={agent.name}
                className={`rounded-2xl border p-5 ${agent.color}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${agent.iconBg}`}
                  >
                    {agent.icon}
                  </div>
                  <h3 className="text-sm font-bold text-stone-900">
                    {agent.name}
                  </h3>
                </div>
                <ul className="space-y-1.5">
                  {agent.responsibilities.map((r) => (
                    <li
                      key={r}
                      className="flex items-start gap-2 text-xs text-stone-600"
                    >
                      <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================
            SECTION 4: Tech Stack
            ================================================================ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-stone-900">
            Tech Stack
          </h2>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Layer
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Technology
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  {
                    layer: 'Frontend',
                    tech: 'Next.js 16 (App Router), React, Tailwind CSS, FullCalendar',
                  },
                  {
                    layer: 'Auth',
                    tech: 'Firebase Auth (email/password, session cookies)',
                  },
                  { layer: 'Database', tech: 'Firestore (document DB)' },
                  {
                    layer: 'Payments',
                    tech: 'Stripe Checkout Sessions, refunds, deposits',
                  },
                  { layer: 'SMS', tech: 'Twilio' },
                  { layer: 'Email', tech: 'Nodemailer (SMTP)' },
                  { layer: 'Job Queue', tech: 'BullMQ + Redis' },
                  { layer: 'AI', tech: 'Claude API (Anthropic) — tool-use agent loop' },
                  { layer: 'Hosting', tech: 'Vercel (serverless)' },
                ].map((row) => (
                  <tr key={row.layer}>
                    <td className="whitespace-nowrap px-6 py-3 font-medium text-stone-900">
                      {row.layer}
                    </td>
                    <td className="px-6 py-3 text-stone-600">{row.tech}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================================================================
            SECTION 5: Data Model
            ================================================================ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-stone-900">
            Data Model
          </h2>
          <p className="mb-6 max-w-3xl text-sm text-stone-500">
            All data is stored in Firestore. Below are the top-level collections
            and key fields for each document type.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                path: '/residents/{id}',
                color: 'border-blue-200',
                fields: [
                  'name, email, phone',
                  'unitNumber',
                  'firebaseUid',
                  'stripeCustomerId',
                ],
              },
              {
                path: '/amenities/{id}',
                color: 'border-emerald-200',
                fields: [
                  'name, capacity, rentalFee',
                  'depositAmount, requiresApproval',
                  'cancellation policy fields',
                  'janitorialAssignment mode',
                ],
                sub: {
                  path: '/blackoutDates/{id}',
                  fields: ['startDate, endDate', 'reason, recurring'],
                },
              },
              {
                path: '/bookings/{id}',
                color: 'border-purple-200',
                fields: [
                  'residentId, amenityId',
                  'status (16 possible states)',
                  'startDatetime, endDatetime',
                  'stripePaymentIntentId',
                ],
                sub: {
                  path: '/auditLogs/{id}',
                  fields: ['agent, event, payload'],
                },
              },
              {
                path: '/inspectionReports/{bookingId}',
                color: 'border-amber-200',
                fields: [
                  'staffId',
                  'status (PASS | FLAG)',
                  'notes, photos[]',
                  'submittedAt',
                ],
              },
              {
                path: '/staff/{id}',
                color: 'border-violet-200',
                fields: [
                  'name, email, phone',
                  'role (PM | JANITORIAL)',
                  'firebaseUid',
                ],
              },
              {
                path: '/settings/global',
                color: 'border-stone-300',
                fields: [
                  'pmEmail',
                  'approvalJwtSecret',
                  'twilioConfig',
                  'smtpConfig',
                ],
              },
              {
                path: '/auditLogs/{id}',
                color: 'border-stone-300',
                fields: [
                  'bookingId (nullable)',
                  'agent, event',
                  'payload (JSON)',
                  'timestamp (immutable)',
                ],
              },
            ].map((col) => (
              <div
                key={col.path}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${col.color}`}
              >
                <p className="font-mono text-sm font-bold text-stone-800">
                  {col.path}
                </p>
                <ul className="mt-3 space-y-1">
                  {col.fields.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-xs text-stone-500"
                    >
                      <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-stone-300" />
                      <span className="font-mono">{f}</span>
                    </li>
                  ))}
                </ul>
                {col.sub && (
                  <div className="mt-3 rounded-lg border border-dashed border-stone-200 bg-stone-50 p-3">
                    <p className="font-mono text-xs font-bold text-stone-600">
                      &nbsp;&nbsp;{col.sub.path}
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {col.sub.fields.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-xs text-stone-400"
                        >
                          <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-stone-300" />
                          <span className="font-mono">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ================================================================
            SECTION 6: Security
            ================================================================ */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-semibold text-stone-900">
            Security
          </h2>

          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: 'Firebase Auth',
                  desc: 'Email/password authentication with server-side session cookies. No client-side tokens exposed to JavaScript.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  ),
                },
                {
                  title: 'Role-Based Access',
                  desc: 'Four roles: resident, property_manager, janitorial, board. Each role gates specific routes and UI sections.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  ),
                },
                {
                  title: 'Proxy Middleware',
                  desc: 'Every request passes through middleware that validates the session cookie. Unauthenticated users are redirected to sign-in.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  ),
                },
                {
                  title: 'Stripe Webhook Verification',
                  desc: 'All incoming Stripe webhook payloads are verified using the webhook signing secret to prevent spoofing.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ),
                },
                {
                  title: 'JWT-Signed Approval Links',
                  desc: 'PM approval/denial email links contain JWT tokens signed with an auto-generated secret. Tokens expire after 48 hours.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                    </svg>
                  ),
                },
                {
                  title: 'Immutable Audit Logs',
                  desc: 'Every state transition and agent action is recorded in append-only audit logs. Entries cannot be modified or deleted.',
                  icon: (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-stone-100 bg-stone-50 p-4"
                >
                  <div className="mb-2 flex items-center gap-2 text-stone-700">
                    {item.icon}
                    <h3 className="text-sm font-bold">{item.title}</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-500">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-xs text-stone-400">
          Sanctuary Booking &mdash; Built with Next.js, Firebase, Stripe, and
          Claude
        </div>
      </div>
    </main>
  )
}
