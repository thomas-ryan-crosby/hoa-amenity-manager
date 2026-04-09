# Neighbri — Go-Live Implementation Plan

**Date:** April 9, 2026
**Target:** Production launch on neighbri.com
**Current status:** App is deployed on Vercel, functional with test keys

---

## Phase 1: Environment Configuration (You — Vercel Dashboard)

These are settings in your Vercel project dashboard under **Settings > Environment Variables**. They may already be partially configured for production — check before changing.

### 1.1 Stripe (Payments)

- [ ] Log in to [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Toggle from **Test mode** to **Live mode** (top-right switch)
- [ ] Copy your live **Publishable key** (`pk_live_...`)
- [ ] Copy your live **Secret key** (`sk_live_...`)
- [ ] Go to **Developers > Webhooks > Add endpoint**
  - URL: `https://neighbri.com/api/webhooks/stripe`
  - Events to listen for: `checkout.session.completed`, `checkout.session.expired`
  - Copy the **Signing secret** (`whsec_...`)
- [ ] Set in Vercel env vars:
  - `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
  - `STRIPE_SECRET_KEY` = `sk_live_...`
  - `STRIPE_WEBHOOK_SECRET` = `whsec_...`

### 1.2 Resend (Email)

- [ ] Log in to [Resend](https://resend.com)
- [ ] **Verify domain**: Add `neighbri.com` → add the DNS records Resend provides (SPF, DKIM, DMARC)
- [ ] Copy your **API key**
- [ ] Set in Vercel env vars:
  - `RESEND_API_KEY` = `re_...`
  - `EMAIL_FROM` = `Neighbri <bookings@neighbri.com>`

### 1.3 App Configuration

- [ ] Set in Vercel env vars:
  - `NEXT_PUBLIC_APP_URL` = `https://neighbri.com`
  - `DRY_RUN` = `false` (or remove entirely)
  - `CRON_SECRET` = (keep current value or generate a new one)

### 1.4 Firebase Service Account

- [ ] Verify `FIREBASE_SERVICE_ACCOUNT_KEY` is set in Vercel env vars (it likely is since the app works on Vercel already)

---

## Phase 2: Security Hardening (Claude will implement)

### 2.1 Firestore Security Rules

Currently in test mode (anyone can read/write). Need rules that:
- Only authenticated users can read their own data
- Only community members can read community-scoped data
- Only admins/PMs can write to admin collections
- Server-side (Admin SDK) bypasses rules anyway, but rules protect against direct Firestore access

### 2.2 Security Headers

Add to `next.config.ts`:
- `X-Frame-Options: DENY` (prevent clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security` (HSTS)

### 2.3 Error Boundaries

- Global error page (`error.tsx`) — friendly "something went wrong" screen
- Not-found page (`not-found.tsx`) — branded 404
- Prevents users from seeing raw error dumps

---

## Phase 3: Password Reset (Claude will implement)

Firebase Auth supports password reset emails natively. Need:
- "Forgot password?" link on the sign-in page
- Calls `sendPasswordResetEmail()` from Firebase Client SDK
- Firebase sends the email automatically (uses Firebase's built-in templates)
- No server-side code needed

---

## Phase 4: Pre-Launch Smoke Test

Run through each flow manually on neighbri.com after all env vars are set:

### Resident Flow
- [ ] Sign up with a new email
- [ ] Join Sanctuary community from dropdown
- [ ] Get approved by a PM/admin
- [ ] Browse calendar, select amenity
- [ ] Book a free amenity → confirm email received with correct times
- [ ] Book a paid amenity → Stripe checkout → confirm payment + confirmation email
- [ ] Cancel a booking → confirm cancellation email + refund (if paid)
- [ ] Check "My Bookings" page

### Admin Flow
- [ ] Log in as community admin
- [ ] View dashboard calendar
- [ ] Approve a pending booking
- [ ] Deny a pending booking with reason
- [ ] Book on behalf of a resident
- [ ] View Insights tab
- [ ] View People tab, change a role
- [ ] View Billing tab

### Neighbri Internal Flow
- [ ] Log in as super-admin
- [ ] View platform dashboard
- [ ] Create a new test community (with first admin)
- [ ] Add a member from the internal community detail page
- [ ] View user lookup

### Email Verification
- [ ] Welcome email on sign-up
- [ ] Approval email when PM approves
- [ ] Booking received email
- [ ] Booking confirmed email
- [ ] Booking cancelled email
- [ ] 48-hour reminder (wait or check logs)

### Edge Cases
- [ ] Try to book beyond max advance days → should be blocked client-side
- [ ] Try to book during a blackout → should be blocked client-side
- [ ] Book where cleaning block conflicts → warning appears
- [ ] Two users book same slot → second gets waitlisted

---

## Phase 5: Sanctuary Community Setup Verification

- [ ] Verify all amenities are configured correctly (fees, approval rules, turn times)
- [ ] Verify PM notification email is set in Settings
- [ ] Verify at least one admin exists for Sanctuary
- [ ] Verify timezone is set to `America/Chicago`
- [ ] Test an end-to-end booking with a real resident

---

## Phase 6: Post-Launch Monitoring (First 48 hours)

- [ ] Monitor Vercel function logs for errors
- [ ] Monitor Stripe dashboard for successful payments
- [ ] Monitor Resend dashboard for email delivery
- [ ] Check that hourly cron runs (48hr reminders, access instructions, follow-ups)
- [ ] Have 2-3 test users go through the full booking flow

---

## Timeline

| Phase | Owner | Time |
|-------|-------|------|
| 1. Env configuration | You | ~30 min |
| 2. Security hardening | Claude | ~30 min |
| 3. Password reset | Claude | ~15 min |
| 4. Smoke test | You | ~1 hour |
| 5. Sanctuary verification | You | ~15 min |
| 6. Post-launch monitoring | You | Ongoing |

---

## What's Already Production-Ready

- Multi-community architecture with role-based access
- Booking workflow (availability, waitlist, approval, payment, confirmation)
- Calendar with real-time cleaning block previews
- Client-side validation (advance days, blackouts)
- Email system (branded, community-specific, correct timezones)
- Admin dashboard, insights, people management, billing
- Internal platform dashboard with community management
- Invite flow for new admins (with email + auto-link on sign-up)
- Cron-based reminders and follow-ups
