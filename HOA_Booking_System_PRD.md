# HOA Amenity Booking System — Product Requirements Document

**Version:** 1.1
**Date:** March 2026
**Owner:** Sanctuary HOA
**Status:** Ready for Development

---

## 1. Overview

An AI-powered amenity booking platform for Sanctuary HOA that automates the full lifecycle of rental requests — from resident inquiry through payment, coordination, and post-event close-out. The system is built around a multi-agent architecture powered by the Claude API, with a resident-facing web UI featuring an embedded booking calendar.

---

## 2. Goals

- Eliminate manual coordination overhead for property management staff
- Give residents a self-service booking experience with real-time availability
- Automate payment collection and deposit management via Stripe
- Keep all stakeholders (residents, PM, janitorial) informed via email and SMS throughout the entire booking lifecycle
- Maintain a full audit trail of every booking state transition

---

## 3. Users & Roles

| Role | Description | Access |
|---|---|---|
| **Resident** | HOA homeowner requesting an amenity | View availability, submit bookings, pay, receive comms |
| **Property Manager** | Approves/denies bookings, manages calendar | Full calendar admin, approve/deny, block dates |
| **Janitorial Staff** | Receives job assignments and submits inspection reports | Job calendar view, inspection checklist |
| **HOA Board** | Read-only oversight of all bookings and utilization | Dashboard, reports |

---

## 4. Bookable Amenities

Each amenity has its own dedicated Google Calendar. Initial set (to be confirmed with PM):

- Clubhouse / Event Room
- Pool Area
- Tennis / Pickleball Courts
- BBQ / Pavilion Area

Each amenity record stores: name, description, max capacity, rental fee, security deposit amount, Google Calendar ID, approval rules, cancellation policy, advance booking window, janitorial assignment logic, and blackout dates. **All amenity configuration is managed by the admin through a Configuration Agent or admin settings UI — no values are hardcoded.**

---

## 5. Booking Lifecycle & State Machine

```
INQUIRY_RECEIVED
  → AVAILABILITY_CHECKING
    → [conflict] → RESIDENT_NOTIFIED (alternative dates offered)
    → [available] → PENDING_APPROVAL
      → [denied] → DENIED
      → [approved] → PAYMENT_PENDING
        → [paid] → CONFIRMED
          → REMINDER_SENT (T-48hrs)
            → IN_PROGRESS (event day)
              → COMPLETED
                → [issues flagged] → DISPUTE
                → [clean] → CLOSED
        → [failed/expired] → PAYMENT_FAILED
  → CANCELLED (any time before CONFIRMED, per amenity-specific cancellation policy)
```

**All state transitions are logged to an immutable audit table with timestamp and acting agent.**

---

## 6. Features

### 6.1 Resident Portal
- Public-facing calendar showing real-time availability per amenity (color-coded, green = open, gray = booked)
- Click-to-book flow: select amenity → pick date/time → enter guest count + notes → submit
- Login via Clerk (email-based, no passwords required for residents)
- Booking history and status tracking per resident
- SMS + email notifications throughout the lifecycle

### 6.2 Property Manager Dashboard
- Full admin calendar: all amenities in one view, color-coded by amenity
- Pending approvals surfaced as a sidebar badge with one-click approve/deny
- Ability to block dates (maintenance, HOA events)
- Booking detail drawer: resident info, payment status, notes
- Export: monthly booking report (CSV)
- **Settings page:** manage all per-amenity configuration (fees, deposits, cancellation policy, approval rules, booking windows, janitorial assignment, blackout dates, staff) via form UI or Configuration Agent chat

### 6.3 Janitorial View
- Personal calendar showing only assigned jobs
- Each job shows: amenity, date/time, pre-event setup checklist, post-event inspection checklist
- Submit inspection report (pass / flag with photo + notes) via mobile-friendly form
- SMS notification for every new job assignment and day-of reminder

### 6.4 HOA Board Dashboard
- Read-only calendar view (all amenities)
- Summary panel: bookings this month, revenue collected, utilization rate per amenity
- No booking management capabilities

### 6.5 Agent System

**Orchestrator Agent** — manages state machine, routes tasks to sub-agents, handles retries and error logic. Never communicates directly with users. Logs every action.

**Resident Agent** — fields inquiries, collects missing info, sends payment links, confirmations, reminders, and post-event follow-up via Gmail + Twilio SMS.

**Property Mgmt Agent** — sends structured approval request emails to PM, processes approve/deny responses, converts calendar holds to confirmed events.

**Janitorial Agent** — sends job notifications to cleaning staff, delivers inspection checklists, receives and parses inspection reports, relays pass/fail status to Orchestrator for deposit processing.

**Configuration Agent** — assists the admin in setting up and modifying per-amenity configuration through a conversational interface. Handles: amenity creation/editing (fees, deposits, capacity), cancellation policy rules, approval rules (auto-approve thresholds, designated PM, escalation path), janitorial assignment logic (rotation vs. manual, staff pool), advance booking window, and blackout date management. All changes are validated, persisted to the database, and logged to the audit trail.

### 6.6 Payment Flow
- Stripe Customer created per resident on first booking
- Stripe Payment Link generated per booking (rental fee + security deposit as separate line items)
- Payment link sent via email + SMS nudge after 1 hour if unpaid
- `payment_intent.succeeded` webhook triggers CONFIRMED state
- Security deposit held; released automatically on clean inspection or flagged for dispute
- Refunds issued programmatically per the amenity's cancellation policy:
  - Cancelled >= `fullRefundHours` before event → 100% refund
  - Cancelled >= `partialRefundHours` before event → `partialRefundPercent`% refund
  - Cancelled within `partialRefundHours` → no refund

### 6.7 Communications

| Trigger | Channel | Recipient |
|---|---|---|
| Inquiry received | Email + SMS | Resident |
| Missing info needed | Email + SMS | Resident |
| Availability conflict | Email + SMS | Resident |
| PM approval request | Email | Property Manager |
| PM denial | Email + SMS | Resident |
| Payment link | Email + SMS | Resident |
| Booking confirmed | Email (+ calendar invite) | Resident + PM |
| Janitorial job assigned | Email + SMS | Janitorial Staff |
| 48hr reminder | Email + SMS | Resident |
| Day-of reminder | SMS | Janitorial Staff |
| Inspection request | Email + SMS | Janitorial Staff |
| Deposit released / dispute | Email | Resident |
| Post-event thank you + survey | Email | Resident |

---

## 7. Technical Architecture

### Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Calendar UI | FullCalendar.js (React) |
| Auth | Clerk (role-based: resident, property_manager, janitorial, board) |
| Styling | Tailwind CSS |
| Agent Intelligence | Claude API (`claude-sonnet-4-6`) |
| Email | Gmail API via MCP |
| Calendar Data | Google Calendar API |
| Payments | Stripe API + Webhooks |
| SMS | Twilio API |
| Database | PostgreSQL via Prisma ORM |
| Job Scheduling | BullMQ + Redis |
| Hosting | Vercel (frontend) + Railway (backend + Redis) |
| Dev Environment | Claude Code + VS Code |

### Folder Structure
```
/
├── app/                          # Next.js App Router
│   ├── (resident)/               # Resident-facing pages
│   │   ├── page.tsx              # Booking calendar
│   │   └── bookings/             # Booking history
│   ├── (admin)/                  # PM + Board pages
│   │   ├── dashboard/
│   │   ├── approvals/
│   │   └── settings/             # Amenity config, staff, blackout dates
│   ├── (janitorial)/             # Janitorial pages
│   └── api/                      # API routes
│       ├── webhooks/
│       │   ├── stripe/
│       │   └── twilio/
│       ├── bookings/
│       ├── amenities/
│       └── agents/
├── lib/
│   ├── agents/                   # Agent logic (pure async functions)
│   │   ├── orchestrator.ts
│   │   ├── resident-agent.ts
│   │   ├── pm-agent.ts
│   │   ├── janitorial-agent.ts
│   │   └── config-agent.ts
│   ├── integrations/
│   │   ├── google-calendar.ts
│   │   ├── gmail.ts
│   │   ├── stripe.ts
│   │   └── twilio.ts
│   ├── db/
│   │   └── schema.prisma
│   └── queue/                    # BullMQ job definitions
│       ├── reminder-jobs.ts
│       └── post-event-jobs.ts
├── components/
│   ├── calendar/
│   │   ├── BookingCalendar.tsx   # FullCalendar wrapper
│   │   ├── AdminCalendar.tsx
│   │   └── JanitorialCalendar.tsx
│   └── ui/                       # Shared UI components
└── prisma/
    └── schema.prisma
```

### Data Model (Prisma)
```prisma
model Booking {
  id                  String        @id @default(cuid())
  residentId          String
  amenityId           String
  status              BookingStatus
  startDatetime       DateTime
  endDatetime         DateTime
  guestCount          Int
  notes               String?
  stripePaymentIntentId String?
  stripeDepositIntentId String?
  calendarEventId     String?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  resident            Resident      @relation(fields: [residentId], references: [id])
  amenity             Amenity       @relation(fields: [amenityId], references: [id])
  auditLogs           AuditLog[]
  inspectionReport    InspectionReport?
}

model Resident {
  id               String    @id @default(cuid())
  clerkUserId      String    @unique
  name             String
  email            String    @unique
  phone            String?
  unitNumber       String
  stripeCustomerId String?
  bookings         Booking[]
}

model Amenity {
  id                    String    @id @default(cuid())
  name                  String
  description           String?
  capacity              Int
  rentalFee             Decimal
  depositAmount         Decimal
  calendarId            String    // Google Calendar ID

  // Approval rules (per amenity)
  requiresApproval      Boolean   @default(true)
  autoApproveThreshold  Int?      // Auto-approve if guest count <= this value; null = always require approval
  approverStaffId       String?   // Designated PM for this amenity; null = default PM_EMAIL
  escalationHours       Int       @default(48) // Hours before approval escalates to fallback PM

  // Cancellation policy (per amenity)
  fullRefundHours       Int       @default(72) // Hours before event for full refund
  partialRefundHours    Int       @default(24) // Hours before event for partial refund (50%)
  partialRefundPercent  Int       @default(50) // Partial refund percentage
  // No refund if cancelled within partialRefundHours of event

  // Booking window
  maxAdvanceBookingDays Int       @default(90) // How far in advance residents can book

  // Janitorial config
  janitorialAssignment  String    @default("rotation") // "rotation" | "manual"

  bookings              Booking[]
  blackoutDates         BlackoutDate[]
  approverStaff         Staff?    @relation(fields: [approverStaffId], references: [id])
}

model BlackoutDate {
  id          String    @id @default(cuid())
  amenityId   String
  startDate   DateTime
  endDate     DateTime
  reason      String?
  recurring   Boolean   @default(false) // If true, recurs annually
  amenity     Amenity   @relation(fields: [amenityId], references: [id])
}

model Staff {
  id    String    @id @default(cuid())
  name  String
  email String    @unique
  phone String?
  role  StaffRole // PROPERTY_MANAGER | JANITORIAL
}

model InspectionReport {
  id          String           @id @default(cuid())
  bookingId   String           @unique
  staffId     String
  status      InspectionStatus // PASS | FLAG
  notes       String?
  submittedAt DateTime         @default(now())
  booking     Booking          @relation(fields: [bookingId], references: [id])
}

model AuditLog {
  id        String   @id @default(cuid())
  bookingId String
  agent     String
  event     String
  payload   Json?
  timestamp DateTime @default(now())
  booking   Booking  @relation(fields: [bookingId], references: [id])
}

enum BookingStatus {
  INQUIRY_RECEIVED
  AVAILABILITY_CHECKING
  PENDING_APPROVAL
  APPROVED
  PAYMENT_PENDING
  CONFIRMED
  REMINDER_SENT
  IN_PROGRESS
  COMPLETED
  CLOSED
  DENIED
  CANCELLED
  PAYMENT_FAILED
  DISPUTE
}

enum StaffRole {
  PROPERTY_MANAGER
  JANITORIAL
}

enum InspectionStatus {
  PASS
  FLAG
}
```

---

## 8. Non-Functional Requirements

- **Availability:** 99.5% uptime. System must remain operational during Google/Stripe outages (graceful degradation — log failures, retry via queue)
- **Security:** All secrets in environment variables. Stripe webhook signature verification required. PM approval links are single-use JWTs with 48hr expiry. PII minimized in Claude API prompts
- **Performance:** Calendar availability view must load in under 2 seconds
- **Audit:** Every booking state transition logged with actor, timestamp, and payload. Logs retained for 2 years
- **Scalability:** System should handle up to 500 active bookings/month without architectural changes

---

## 9. Out of Scope (v1)

- Mobile native app (web is mobile-responsive)
- Resident-to-resident waitlist for popular slots
- Multi-HOA / multi-property support
- In-app chat between residents and PM
- Integration with HOA accounting software

---

## 10. Open Questions — Resolved

| # | Question | Resolution |
|---|---|---|
| 1 | Which amenities are bookable and what are the fees/deposits for each? | **Per amenity.** Admin configures via Configuration Agent. No hardcoded amenity list — amenities, fees, and deposits are all admin-managed. |
| 2 | What is the cancellation policy? | **Per amenity.** Admin sets `fullRefundHours`, `partialRefundHours`, and `partialRefundPercent` on each amenity via Configuration Agent. |
| 3 | Should PM approval be required for all bookings? | **Per amenity.** Admin sets `requiresApproval` and `autoApproveThreshold` (guest count) per amenity via Configuration Agent. |
| 4 | Who is the designated PM for approvals, and escalation path? | **Per amenity.** Admin assigns `approverStaffId` and sets `escalationHours` per amenity. Fallback is `PM_EMAIL` env var. |
| 5 | How many janitorial staff, and assignment logic? | **Per amenity.** Admin sets `janitorialAssignment` ("rotation" or "manual") per amenity via Configuration Agent. Staff records are managed in admin settings. |
| 6 | Maximum advance booking window? | **Per amenity.** Admin sets `maxAdvanceBookingDays` per amenity via Configuration Agent. Default: 90 days. |
| 7 | Recurring blackout dates or pre-existing holds? | **Per amenity.** Admin manages `BlackoutDate` records per amenity via Configuration Agent, with support for one-time and annually recurring dates. |
| 8 | HOA's preferred SMS number (Twilio)? | **TBD.** Twilio number to be provisioned before launch. Configured via `TWILIO_PHONE_NUMBER` env var. |

---

---

# Claude Code Build Guide

## Prerequisites

Before writing a single line of code, complete these setup steps.

### Accounts & API Keys to Provision
- [ ] **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)
- [ ] **Clerk account** — [clerk.com](https://clerk.com) — create app, configure 4 roles
- [ ] **Google Cloud project** — enable Calendar API + Gmail API, create service account, download credentials JSON
- [ ] **Stripe account** — get publishable + secret keys, set up webhook endpoint
- [ ] **Twilio account** — provision SMS number, get Account SID + Auth Token
- [ ] **Railway account** — [railway.app](https://railway.app) — for PostgreSQL + Redis
- [ ] **Vercel account** — [vercel.com](https://vercel.com) — for frontend hosting

### Local Tools to Install
```bash
# Node.js 20+ (use nvm)
nvm install 20 && nvm use 20

# Claude Code
npm install -g @anthropic-ai/claude-code

# Prisma CLI
npm install -g prisma

# Vercel CLI
npm install -g vercel
```

---

## Phase 1 — Project Scaffold & Auth (Week 1)

### Step 1.1 — Create the Next.js app

Open VS Code, open a terminal, and run:

```bash
npx create-next-app@latest sanctuary-booking \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
cd sanctuary-booking
code .
```

### Step 1.2 — Open Claude Code and run this prompt

```
I'm building an HOA amenity booking system called Sanctuary Booking. 

Install and configure the following packages:
- @clerk/nextjs (auth with 4 roles: resident, property_manager, janitorial, board)
- @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/resource-timegrid @fullcalendar/interaction
- @prisma/client prisma
- @anthropic-ai/sdk
- stripe @stripe/stripe-js
- twilio
- bullmq ioredis
- @google-auth-library googleapis
- nodemailer
- zod

Set up the folder structure exactly as follows:
- /src/app/(resident)/ with page.tsx (booking calendar placeholder)
- /src/app/(admin)/dashboard/ with page.tsx
- /src/app/(janitorial)/ with page.tsx
- /src/app/api/webhooks/stripe/ with route.ts
- /src/app/api/webhooks/twilio/ with route.ts
- /src/app/api/bookings/ with route.ts
- /src/app/api/amenities/ with route.ts
- /src/lib/agents/ with orchestrator.ts, resident-agent.ts, pm-agent.ts, janitorial-agent.ts, config-agent.ts (empty async function stubs)
- /src/lib/integrations/ with google-calendar.ts, gmail.ts, stripe.ts, twilio.ts (empty stubs)
- /src/lib/queue/ with reminder-jobs.ts, post-event-jobs.ts
- /src/components/calendar/ with BookingCalendar.tsx, AdminCalendar.tsx, JanitorialCalendar.tsx

Configure Clerk middleware in middleware.ts with route protection:
- Public: /, /api/webhooks/*
- Resident: /bookings/*, /api/bookings/*
- Admin: /admin/*, /api/admin/* (includes /admin/settings/*)
- Janitorial: /janitorial/*

Create a .env.local.example file with all required environment variables listed.
```

### Step 1.3 — Set up environment variables

Copy `.env.local.example` to `.env.local` and fill in all values:

```env
# Anthropic
ANTHROPIC_API_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Google
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_CALENDAR_IDS={"clubhouse":"...","pool":"..."}

# Stripe
STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
PM_EMAIL=board@sanctuaryhoa.org
PM_APPROVAL_JWT_SECRET=
```

### Step 1.4 — Build the Prisma schema

Prompt Claude Code:

```
Create the Prisma schema at /prisma/schema.prisma using PostgreSQL provider.
Include these models exactly as specified:
Booking, Resident, Amenity, Staff, InspectionReport, AuditLog
with the BookingStatus, StaffRole, and InspectionStatus enums.

[Paste the full Prisma schema from the PRD]

Then run:
  npx prisma generate
  npx prisma migrate dev --name init
```

**Checkpoint:** `npx prisma studio` should open and show all empty tables.

---

## Phase 2 — Database & Google Calendar Integration (Week 1–2)

### Step 2.1 — Google Calendar integration

Prompt Claude Code:

```
In /src/lib/integrations/google-calendar.ts, implement these functions
using the googleapis package and service account credentials from env:

- checkAvailability(calendarId: string, start: Date, end: Date): Promise<boolean>
  Query the calendar for events in the time window. Return true if no conflicts.

- createHold(calendarId: string, bookingId: string, start: Date, end: Date): Promise<string>
  Create a tentative event (status: tentative) and return the Google event ID.

- confirmEvent(calendarId: string, eventId: string, attendeeEmails: string[]): Promise<void>
  Patch the event to status: confirmed and add attendees.

- deleteEvent(calendarId: string, eventId: string): Promise<void>
  Delete the calendar event.

All functions should throw descriptive errors on failure.
Write a simple test function at the bottom that checks availability for tomorrow.
```

### Step 2.2 — Seed amenity data

Prompt Claude Code:

```
Create /prisma/seed.ts that seeds the database with:
- 4 amenities: Clubhouse, Pool Area, Tennis Courts, BBQ Pavilion
  Each with placeholder calendarId, rentalFee: 150, depositAmount: 200, requiresApproval: true,
  fullRefundHours: 72, partialRefundHours: 24, partialRefundPercent: 50,
  maxAdvanceBookingDays: 90, janitorialAssignment: "rotation"
  (These are defaults — admin will customize per amenity via Configuration Agent)
- 2 staff records: one PROPERTY_MANAGER, one JANITORIAL with placeholder emails

Run: npx ts-node prisma/seed.ts
```

---

## Phase 3 — Booking API & State Machine (Week 2)

### Step 3.1 — Core booking API

Prompt Claude Code:

```
In /src/app/api/bookings/route.ts, implement:

POST /api/bookings
- Authenticate via Clerk, extract residentId
- Validate body with Zod: { amenityId, startDatetime, endDatetime, guestCount, notes? }
- Create Booking record with status INQUIRY_RECEIVED
- Write an AuditLog entry
- Trigger orchestrator (import and call orchestrator.handleNewBooking(bookingId))
- Return { bookingId, status }

GET /api/bookings
- Return all bookings for the authenticated resident (status, amenity name, dates)

GET /api/bookings/[id]
- Return full booking detail for the authenticated resident

Also create /src/app/api/amenities/route.ts:
GET /api/amenities
- Return all amenities with their name, capacity, rentalFee, depositAmount
```

### Step 3.2 — Orchestrator agent

Prompt Claude Code:

```
In /src/lib/agents/orchestrator.ts, implement handleNewBooking(bookingId: string):

1. Load booking + amenity from database
2. Update status to AVAILABILITY_CHECKING, write audit log
3. Call googleCalendar.checkAvailability() for the requested slot
4. If conflict:
   - Update status to DENIED (with reason: "Time slot unavailable")
   - Call residentAgent.notifyUnavailable(bookingId)
   - Return
5. If available:
   - Validate booking date is within amenity.maxAdvanceBookingDays
   - Check no BlackoutDate conflicts for the amenity
   - Call googleCalendar.createHold() and save eventId to booking
   - Check amenity approval rules:
     - If amenity.requiresApproval is false → skip to PAYMENT_PENDING
     - If amenity.autoApproveThreshold is set and guestCount <= threshold → skip to PAYMENT_PENDING
     - Otherwise → update status to PENDING_APPROVAL, call pmAgent.sendApprovalRequest(bookingId)
   - Write audit log
   - Return

Each status update must:
- Use a Prisma transaction
- Write to AuditLog with agent: "orchestrator", event: "STATUS_CHANGE", payload: { from, to }

Export also:
- handleApproval(bookingId: string): transitions to PAYMENT_PENDING, triggers residentAgent.sendPaymentLink()
- handleDenial(bookingId: string, reason: string): transitions to DENIED, triggers residentAgent.notifyDenied()
- handlePaymentSuccess(bookingId: string): transitions to CONFIRMED, triggers all confirmation actions
- handlePaymentFailed(bookingId: string): transitions to PAYMENT_FAILED, triggers residentAgent.nudgePayment()
- handleCancellation(bookingId: string): transitions to CANCELLED, calculates refund per amenity's cancellation policy (fullRefundHours / partialRefundHours / partialRefundPercent), triggers refund + calendar delete
```

---

## Phase 4 — Stripe Integration (Week 2–3)

### Step 4.1 — Stripe service

Prompt Claude Code:

```
In /src/lib/integrations/stripe.ts, implement:

- getOrCreateCustomer(resident: Resident): Promise<string>
  Look up resident.stripeCustomerId; if null, create Stripe customer and save ID to DB.

- createPaymentLink(bookingId: string, rentalFee: number, depositAmount: number, customerId: string): Promise<string>
  Create a Stripe Payment Link with two line items (rental fee + security deposit).
  Set metadata: { bookingId }
  Set success_url and cancel_url to app URLs.
  Return the Payment Link URL.

- issueRefund(paymentIntentId: string, amount?: number): Promise<void>
  Issue full refund if amount not specified, partial refund otherwise.
```

### Step 4.2 — Stripe webhook

Prompt Claude Code:

```
In /src/app/api/webhooks/stripe/route.ts, implement the webhook handler:

- Verify Stripe webhook signature using STRIPE_WEBHOOK_SECRET
- Handle these events:
  - payment_intent.succeeded → call orchestrator.handlePaymentSuccess(bookingId from metadata)
  - payment_intent.payment_failed → call orchestrator.handlePaymentFailed(bookingId)
- Return 200 immediately; do all processing async
- Log every received event to console with event type and bookingId

Use the raw request body for signature verification (disable Next.js body parsing for this route).
```

---

## Phase 5 — Agent Communications (Week 3)

### Step 5.1 — Gmail integration

Prompt Claude Code:

```
In /src/lib/integrations/gmail.ts, implement sendEmail(options):
- options: { to: string, subject: string, html: string, attachments?: [] }
- Use Gmail API with service account + domain-wide delegation
- From address: bookings@sanctuaryhoa.org (or configured address)
- Return messageId on success
```

### Step 5.2 — Twilio SMS integration

Prompt Claude Code:

```
In /src/lib/integrations/twilio.ts, implement sendSMS(to: string, body: string): Promise<void>
- Use Twilio REST client
- From: TWILIO_PHONE_NUMBER env var
- Body must be under 160 characters; log a warning if longer
- Throw on failure
```

### Step 5.3 — Resident Agent

Prompt Claude Code:

```
In /src/lib/agents/resident-agent.ts, implement these functions.
Each function loads the booking + resident from the database, then calls gmail and twilio.

- notifyUnavailable(bookingId): email + SMS telling resident the slot is taken, offer to try another date
- notifyDenied(bookingId, reason): email + SMS with PM's denial reason, invite them to contact the office
- sendPaymentLink(bookingId, paymentUrl): email with Stripe payment link + SMS nudge with shortened URL
- nudgePayment(bookingId): SMS reminder that payment link is still pending (1hr after send)
- sendConfirmation(bookingId): email with full booking summary + .ics calendar invite attachment
- send48hrReminder(bookingId): email + SMS with event details and HOA amenity rules reminder
- sendPostEventFollowUp(bookingId): email thank you + link to 5-star satisfaction survey (Google Form placeholder)

Use plain HTML email templates (inline styles, no external CSS).
Keep SMS messages under 160 characters.
```

### Step 5.4 — PM Agent

Prompt Claude Code:

```
In /src/lib/agents/pm-agent.ts, implement:

- sendApprovalRequest(bookingId):
  Email to amenity's designated approver (amenity.approverStaff.email), falling back to PM_EMAIL env var, with:
  - Full booking summary (resident, amenity, date, time, guest count, fee, deposit)
  - Two signed JWT links: /api/admin/approve/[token] and /api/admin/deny/[token]
  - JWT payload: { bookingId, action }, signed with PM_APPROVAL_JWT_SECRET, expires 48hrs

Create /src/app/api/admin/approve/[token]/route.ts:
  - Verify JWT, extract bookingId
  - Call orchestrator.handleApproval(bookingId)
  - Redirect to /admin/dashboard with success message

Create /src/app/api/admin/deny/[token]/route.ts:
  - Verify JWT, extract bookingId
  - Accept optional ?reason= query param
  - Call orchestrator.handleDenial(bookingId, reason)
  - Redirect to /admin/dashboard
```

### Step 5.5 — Janitorial Agent

Prompt Claude Code:

```
In /src/lib/agents/janitorial-agent.ts, implement:

- notifyJobAssigned(bookingId):
  Load booking + amenity. Assign JANITORIAL staff based on amenity.janitorialAssignment setting:
    - "rotation": round-robin from Staff table
    - "manual": flag for PM to assign via admin dashboard
  Send email + SMS to assigned staff with:
  - Amenity name, date, start/end time
  - Pre-event setup checklist (hardcoded for v1: unlock facility, check supplies, set up tables/chairs)
  - Link to post-event inspection form: /janitorial/inspect/[bookingId]

- sendInspectionReminder(bookingId):
  SMS to assigned janitorial staff 2hrs after event end time.

Create /src/app/(janitorial)/inspect/[bookingId]/page.tsx:
  - Mobile-friendly inspection form: Pass / Flag radio, notes textarea, photo upload
  - On submit: POST to /api/bookings/[id]/inspection
  
Create /src/app/api/bookings/[id]/inspection/route.ts:
  - Save InspectionReport to DB
  - Call orchestrator.handleInspectionComplete(bookingId, status)

In orchestrator.ts, add handleInspectionComplete(bookingId, status):
  - If PASS: issue deposit refund via stripe.issueRefund(), update status CLOSED, email resident
  - If FLAG: update status DISPUTE, email PM + resident with inspection notes
```

---

## Phase 5.6 — Configuration Agent & Admin Settings

### Step 5.6.1 — Configuration Agent

Prompt Claude Code:

```
In /src/lib/agents/config-agent.ts, implement a Configuration Agent that assists
the admin in managing per-amenity settings through a conversational interface.

The agent should handle these operations:
- Create / edit / delete amenities (name, description, capacity, rentalFee, depositAmount, calendarId)
- Set cancellation policy per amenity (fullRefundHours, partialRefundHours, partialRefundPercent)
- Set approval rules per amenity (requiresApproval, autoApproveThreshold, approverStaffId, escalationHours)
- Set janitorial assignment logic per amenity ("rotation" or "manual")
- Set max advance booking window per amenity (maxAdvanceBookingDays)
- Manage blackout dates per amenity (add/remove, one-time or recurring)
- Manage staff records (add/edit janitorial and PM staff)

All changes must:
- Validate inputs (e.g., fees must be >= 0, refund hours must be logical)
- Persist to the database via Prisma
- Write an AuditLog entry with agent: "config-agent"

Use Claude API to power the conversational interface. The agent should
confirm changes before applying them and summarize what was changed.
```

### Step 5.6.2 — Admin Configuration UI

Prompt Claude Code:

```
Create /src/app/(admin)/settings/page.tsx — an admin settings page with:

- Amenity management: table of all amenities with edit buttons
- Per-amenity settings drawer with fields for all configurable properties:
  - Basic: name, description, capacity, rental fee, deposit, calendar ID
  - Approval: requires approval toggle, auto-approve guest threshold, designated approver dropdown, escalation hours
  - Cancellation: full refund hours, partial refund hours, partial refund percent
  - Scheduling: max advance booking days, janitorial assignment mode
- Blackout date manager per amenity: calendar view to add/remove blackout dates with recurring toggle
- Staff management: list of staff with role, email, phone — add/edit/remove
- Embedded Configuration Agent chat panel for conversational setup

Create corresponding API routes:
  POST/PUT/DELETE /api/admin/amenities
  POST/PUT/DELETE /api/admin/amenities/[id]/blackout-dates
  POST/PUT/DELETE /api/admin/staff
  POST /api/admin/config-agent (chat endpoint for config agent)

All routes must verify property_manager Clerk role.
```

---

## Phase 6 — Calendar UI (Week 3–4)

### Step 6.1 — Resident booking calendar

Prompt Claude Code:

```
In /src/components/calendar/BookingCalendar.tsx, build a FullCalendar React component:

- Use resourceTimeGridWeek view with one resource per amenity
- Fetch events from GET /api/calendar/events (create this route — returns all CONFIRMED bookings as FullCalendar event objects)
- Color coding: each amenity gets a distinct color; booked slots are gray and non-clickable
- On click of an open slot: open a booking drawer (slide-in panel) with:
  - Amenity name (pre-filled)
  - Date + time (pre-filled from click)
  - Guest count input
  - Notes textarea
  - "Request Booking" button → POST /api/bookings
- Show loading skeleton while fetching
- Mobile responsive

Use Tailwind for all styling. No external UI libraries except shadcn/ui for the drawer.
```

### Step 6.2 — Admin calendar

Prompt Claude Code:

```
In /src/components/calendar/AdminCalendar.tsx, build the PM admin calendar:

- Same resource view as resident calendar, but shows ALL bookings including PENDING_APPROVAL
- PENDING_APPROVAL events show in amber/yellow with a "pending" badge
- Clicking a PENDING_APPROVAL event opens an approval panel with:
  - Full booking details
  - Approve button → POST /api/admin/bookings/[id]/approve
  - Deny button (with reason textarea) → POST /api/admin/bookings/[id]/deny
- Add a "Block Dates" button that lets PM create a BLOCKED event on any amenity calendar
- Top-right: "Export CSV" button for current month bookings

Create the corresponding API routes for approve/deny actions.
```

### Step 6.3 — Janitorial calendar

Prompt Claude Code:

```
In /src/components/calendar/JanitorialCalendar.tsx:

- Simple listWeek view (list format, not grid — better on mobile)
- Only shows jobs assigned to the authenticated janitorial staff member
- Each event shows: amenity, time, status (upcoming / inspection needed / complete)
- Tap event → shows checklist and link to inspection form if status is "inspection needed"
```

---

## Phase 7 — Scheduled Jobs (Week 4)

Prompt Claude Code:

```
In /src/lib/queue/reminder-jobs.ts, set up BullMQ workers:

Worker: "booking-reminders"
- Job type "send-48hr-reminder":
  - Payload: { bookingId }
  - Action: call residentAgent.send48hrReminder(bookingId) + janitorialAgent.notifyJobAssigned(bookingId)
  - Schedule: when booking transitions to CONFIRMED, add this job with delay = (startDatetime - 48hrs - now)

- Job type "post-event-followup":
  - Payload: { bookingId }
  - Action: call janitorialAgent.sendInspectionReminder(bookingId) + residentAgent.sendPostEventFollowUp(bookingId)
  - Schedule: when booking transitions to CONFIRMED, add this job with delay = (endDatetime + 2hrs - now)

Add job scheduling calls inside orchestrator.handlePaymentSuccess().

Create /src/app/api/queue/worker/route.ts as a long-running route that starts the BullMQ worker.
Add a note in README that this worker must be running separately in production (Railway worker service).
```

---

## Phase 8 — Hardening & Launch Prep (Week 5)

### Step 8.1 — Error handling

Prompt Claude Code:

```
Add global error handling to the agent layer:

1. Wrap all agent function bodies in try/catch
2. On any error: log to console with bookingId + error details, write an AuditLog entry with event: "AGENT_ERROR"
3. For transient errors (network, API rate limits): add to a BullMQ retry queue with exponential backoff (max 3 retries)
4. For fatal errors: update booking status to a new ERROR state, send alert email to PM_EMAIL

Also add input validation with Zod to all /api/ routes that accept a body.
Return structured error responses: { error: string, code: string }
```

### Step 8.2 — Environment & security audit

Prompt Claude Code:

```
Perform a security audit of the codebase:

1. Confirm no API keys or secrets appear anywhere in source files
2. Verify Stripe webhook signature verification is present and correct
3. Verify all PM approval JWT tokens are verified before any action is taken
4. Confirm all /api/admin/* routes check for property_manager Clerk role
5. Confirm all /api/bookings/* routes check for authenticated resident
6. Check that Prisma queries never expose one resident's data to another
7. Verify CORS is locked to NEXT_PUBLIC_APP_URL only

List any issues found with file + line number. Fix them.
```

### Step 8.3 — Deploy

Prompt Claude Code:

```
Help me deploy this application:

1. Create a vercel.json that configures:
   - All /api/webhooks/* routes as edge functions with rawBody: true
   - All other API routes as Node.js serverless functions

2. Create a Railway deployment config (railway.json) for:
   - A PostgreSQL database service
   - A Redis service  
   - A Node.js worker service that runs the BullMQ worker

3. Write a DEPLOYMENT.md with step-by-step instructions:
   - How to push to Vercel via CLI
   - How to set all environment variables in Vercel dashboard
   - How to run prisma migrate in production
   - How to start the Railway worker service
   - How to test the Stripe webhook with the Stripe CLI
   - How to verify end-to-end with a test booking
```

---

## Claude Code Tips for This Project

**Starting each session:** Open your project in VS Code, open the Claude Code panel (or terminal), and always start with:
```
Read the PRD at /HOA_Booking_System_PRD.md and the current state of the codebase before we begin.
```

**When something breaks:** Paste the full error into Claude Code with:
```
This error occurred when [what you were doing]. Here's the full stack trace: [paste]. 
Fix it and explain what caused it.
```

**Iterating on agent prompts:** The agent system prompts (in each `*-agent.ts` file) will need tuning. Tell Claude Code:
```
The resident agent's confirmation email is too long and formal. 
Rewrite the email template to be warm, brief, and mobile-friendly.
```

**Testing agents without sending real emails/SMS:**
```
Add a DRY_RUN env var. When set to true, all gmail.sendEmail() and twilio.sendSMS() calls 
should log the content to console instead of sending. This lets me test the full booking 
flow locally without side effects.
```

**Checking booking state:** At any time, you can ask Claude Code:
```
Write a script I can run with ts-node that prints the full history of booking [ID] 
including all audit log entries in chronological order.
```

---

## Definition of Done (Per Phase)

| Phase | Done When |
|---|---|
| 1 — Scaffold | App runs locally, Clerk auth works, all 4 roles can log in |
| 2 — Calendar & DB | Google Calendar availability check returns correct results, Prisma studio shows seeded data |
| 3 — Booking API | POST /api/bookings creates a record, orchestrator transitions state to PENDING_APPROVAL, hold appears on Google Calendar |
| 4 — Stripe | Payment link is generated and sent, payment_intent.succeeded webhook transitions booking to CONFIRMED |
| 5 — Agents | Full end-to-end manual test: submit booking → PM approves → pay → all emails/SMS fire correctly |
| 6 — Calendar UI | Resident can see availability and submit a booking through the UI; PM can approve from the admin calendar |
| 7 — Scheduled Jobs | 48hr reminder fires correctly for a test booking; post-event inspection flow completes |
| 8 — Hardening | No secrets in code, all routes auth-protected, app deployed to Vercel + Railway, end-to-end test passes in production |
