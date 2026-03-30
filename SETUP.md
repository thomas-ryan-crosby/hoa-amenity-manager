# Sanctuary Booking — Setup Guide

Step-by-step instructions to get the HOA Amenity Booking System running locally and on Vercel.

---

## Prerequisites

- Node.js 20+ (`node -v` to verify)
- A GitHub account (repo already at https://github.com/thomas-ryan-crosby/hoa-amenity-manager)
- Accounts for the services below (free tiers work for dev)

---

## Step 1: Clerk (Authentication)

1. Go to https://clerk.com and create a free account
2. Create a new application called "Sanctuary Booking"
3. In the Clerk dashboard, go to **Configure > Roles** and create these 4 roles:
   - `resident`
   - `property_manager`
   - `janitorial`
   - `board`
4. Go to **Configure > API Keys** and copy:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)
5. Go to **Configure > Webhooks**, create a webhook endpoint pointed at your app URL + `/api/webhooks/clerk`, copy the signing secret as `CLERK_WEBHOOK_SECRET`
6. To assign roles to users: go to **Users** in the Clerk dashboard, click a user, go to **Public metadata**, and add:
   ```json
   { "role": "property_manager" }
   ```

---

## Step 2: PostgreSQL Database

### Option A: Neon (recommended, free tier)
1. Go to https://neon.tech and create a free account
2. Create a new project called "sanctuary-booking"
3. Copy the connection string — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save it as `DATABASE_URL`

### Option B: Vercel Postgres
1. In your Vercel project dashboard, go to **Storage > Create Database > Postgres**
2. Follow the prompts — Vercel auto-populates the env vars

### Option C: Railway
1. Go to https://railway.app, create a PostgreSQL service
2. Copy the connection string from the service variables

### Run the migration
```bash
# Set DATABASE_URL in your .env.local first, then:
npx prisma migrate dev --name init
```

### Seed the database
```bash
npx tsx prisma/seed.ts
```

This creates 4 amenities (Clubhouse, Pool, Tennis Courts, BBQ Pavilion) and 2 staff members.

---

## Step 3: Redis (for BullMQ job queue)

### Option A: Upstash (recommended, free tier)
1. Go to https://upstash.com and create a free account
2. Create a Redis database
3. Copy the connection string (use the `redis://` format, not REST)
4. Save as `REDIS_URL`

### Option B: Railway
1. Add a Redis service to your Railway project
2. Copy the connection string

> Redis is only needed for the scheduled job system (48hr reminders, post-event followups). The app runs without it — those features just won't work.

---

## Step 4: Stripe (Payments)

1. Go to https://dashboard.stripe.com and create an account (or use test mode on an existing account)
2. Make sure you're in **Test Mode** (toggle in top-right)
3. Go to **Developers > API keys**:
   - Copy the **Publishable key** → `STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - Copy the **Secret key** → `STRIPE_SECRET_KEY` (starts with `sk_test_`)
4. Go to **Developers > Webhooks**:
   - Click **Add endpoint**
   - For local dev, use Stripe CLI (see below). For Vercel, use `https://your-app.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `checkout.session.expired`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)

### Local webhook testing with Stripe CLI
```bash
# Install: https://docs.stripe.com/stripe-cli
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
# The CLI prints a webhook signing secret — use that for local dev
```

---

## Step 5: Google Calendar + Gmail

1. Go to https://console.cloud.google.com
2. Create a new project (or use an existing one)
3. Enable these APIs:
   - Google Calendar API
   - Gmail API
4. Go to **IAM & Admin > Service Accounts**:
   - Create a service account
   - Download the JSON key file
   - From the JSON, extract:
     - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
     - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` (keep the `\n` escape sequences)
5. **For Gmail**: Enable domain-wide delegation on the service account and grant it the Gmail send scope in your Google Workspace admin panel
6. **For Calendar**: Share each Google Calendar with the service account email (give it "Make changes to events" permission)
7. Set calendar IDs:
   ```
   GOOGLE_CALENDAR_IDS={"clubhouse":"abc@group.calendar.google.com","pool":"def@group.calendar.google.com","tennis":"ghi@group.calendar.google.com","bbq":"jkl@group.calendar.google.com"}
   ```

> **Skip this step for initial dev** — the app logs calendar/email operations to console when these aren't configured. You can set `DRY_RUN=true` to suppress all external calls.

---

## Step 6: Twilio (SMS)

1. Go to https://www.twilio.com and create a free account
2. Get a phone number (Twilio gives you one free trial number)
3. From the dashboard, copy:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER` (format: `+15551234567`)

> **Skip this step for initial dev** — set `DRY_RUN=true` and SMS messages will log to console instead of sending.

---

## Step 7: Anthropic (Config Agent AI)

1. Go to https://console.anthropic.com
2. Create an API key → `ANTHROPIC_API_KEY`

> Only needed for the Configuration Agent chat feature in admin settings. The rest of the app works without it.

---

## Step 8: Create .env.local

```bash
cp .env.example .env.local
```

Fill in every value. Here's the minimal set to get the app running locally:

```env
# REQUIRED for the app to start
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...

# RECOMMENDED for dev
DRY_RUN=true
NEXT_PUBLIC_APP_URL=http://localhost:3001
PM_EMAIL=you@example.com
PM_APPROVAL_JWT_SECRET=any-random-string-here-for-dev

# OPTIONAL — add when ready
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## Step 9: Run Locally

```bash
# Install dependencies (if not already done)
npm install

# Run database migration
npx prisma migrate dev --name init

# Seed the database
npx tsx prisma/seed.ts

# Start the dev server
npm run dev
```

Open http://localhost:3000 (or 3001 if 3000 is taken).

### Pages to visit:

| Page | URL | Auth required |
|------|-----|---------------|
| Landing page | `/` | No |
| Resident booking | `/resident` | Yes (any role) |
| Booking history | `/resident/bookings` | Yes (resident) |
| Admin dashboard | `/admin/dashboard` | Yes (property_manager) |
| Admin settings | `/admin/settings` | Yes (property_manager) |
| Pending approvals | `/admin/approvals` | Yes (property_manager) |
| Janitorial calendar | `/janitorial` | Yes (janitorial) |
| Inspection form | `/janitorial/inspect/[bookingId]` | Yes (janitorial) |

---

## Step 10: Deploy to Vercel

The project is already connected to Vercel. Any push to `main` auto-deploys.

### Add environment variables in Vercel:
1. Go to https://vercel.com/thomasryancrosby-4237s-projects/hoa-ammenity-manager/settings/environment-variables
2. Add every variable from your `.env.local` (except `DRY_RUN` — remove that for production)
3. Make sure `NEXT_PUBLIC_APP_URL` points to your Vercel domain (e.g., `https://hoa-ammenity-manager.vercel.app`)

### Run the production migration:
```bash
# With DATABASE_URL set to your production database:
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

### Update Stripe webhook URL:
In the Stripe dashboard, update the webhook endpoint to:
```
https://hoa-ammenity-manager.vercel.app/api/webhooks/stripe
```

---

## Step 11: Test End-to-End

1. Sign up as a user via Clerk on the live site
2. In Clerk dashboard, set their role to `resident` in public metadata
3. Log in, go to `/resident`, select a time slot, submit a booking request
4. Check the database with `npx prisma studio` — you should see the booking in `INQUIRY_RECEIVED` state
5. If Google Calendar is configured, the orchestrator will check availability and transition the booking through the state machine
6. With `DRY_RUN=true`, all emails/SMS are logged to the Vercel function logs (or your terminal locally)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Clerk auth errors on protected pages | Make sure both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set |
| "PrismaClientInitializationError" | Check `DATABASE_URL` is correct and the database is accessible |
| Stripe webhook 400 errors | Make sure `STRIPE_WEBHOOK_SECRET` matches the endpoint in Stripe dashboard |
| Calendar pages show loading skeleton forever | Check browser console for API errors — likely a Clerk auth issue |
| "Neither apiKey nor config.authenticator" | `ANTHROPIC_API_KEY` is missing — only affects the config agent chat |
| Build fails on Vercel | Check that all env vars are set in Vercel settings (esp. `DATABASE_URL`) |

---

## Architecture Quick Reference

```
Frontend (Next.js 16 on Vercel)
  ├── /resident          → Booking calendar + history
  ├── /admin             → Dashboard, approvals, settings
  ├── /janitorial        → Job calendar + inspection forms
  └── /api               → All backend logic (serverless)

Backend services
  ├── PostgreSQL (Neon)  → All data (Prisma ORM)
  ├── Redis (Upstash)    → BullMQ job queue
  ├── Stripe             → Payments + refunds
  ├── Google Calendar    → Availability + holds
  ├── Gmail API          → Email notifications
  ├── Twilio             → SMS notifications
  └── Claude API         → Config agent intelligence
```
