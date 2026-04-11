'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Animated calendar demo — shows bookings appearing on a mini calendar
// ---------------------------------------------------------------------------
function CalendarDemo() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 5), 2000)
    return () => clearInterval(interval)
  }, [])

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm']

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-stone-900">Apr 14 – Apr 20, 2026</p>
        <div className="flex gap-1">
          <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">Day</span>
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] text-white font-medium">Week</span>
          <span className="rounded bg-stone-100 px-2 py-0.5 text-[10px] text-stone-500">Month</span>
        </div>
      </div>
      {/* Amenity tabs */}
      <div className="flex gap-1.5 mb-3">
        <span className="rounded-full bg-stone-900 px-3 py-1 text-[10px] text-white font-medium">Clubhouse</span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] text-stone-600">Pool</span>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-[10px] text-stone-600">Tennis Court 1</span>
      </div>
      {/* Grid */}
      <div className="grid grid-cols-8 text-[9px] text-stone-400">
        <div />
        {days.map((d) => (
          <div key={d} className="text-center font-medium py-1">{d}</div>
        ))}
        {hours.map((h, hi) => (
          <div key={h} className="contents">
            <div className="text-right pr-2 py-2">{h}</div>
            {days.map((d, di) => {
              // Animated bookings that appear at different steps
              const isBooking1 = di === 1 && hi >= 1 && hi <= 3 && step >= 1
              const isBooking2 = di === 3 && hi >= 2 && hi <= 4 && step >= 2
              const isBooking3 = di === 5 && hi >= 0 && hi <= 5 && step >= 3
              const isCleaning = di === 1 && hi === 4 && step >= 1
              const isSelection = di === 4 && hi >= 1 && hi <= 2 && step === 4

              return (
                <div
                  key={`${d}-${h}`}
                  className={`border-t border-l border-stone-100 py-2 px-0.5 transition-all duration-500 ${
                    isSelection ? 'bg-blue-100' : ''
                  }`}
                >
                  {isBooking1 && hi === 1 && (
                    <div className="rounded bg-emerald-500 px-1 py-0.5 text-[8px] text-white font-medium animate-in fade-in duration-500">
                      Smith Family
                    </div>
                  )}
                  {isBooking2 && hi === 2 && (
                    <div className="rounded bg-emerald-500 px-1 py-0.5 text-[8px] text-white font-medium animate-in fade-in duration-500">
                      Johnson Event
                    </div>
                  )}
                  {isBooking3 && hi === 0 && (
                    <div className="rounded bg-emerald-500 px-1 py-0.5 text-[8px] text-white font-medium animate-in fade-in duration-500">
                      Pool Party
                    </div>
                  )}
                  {isCleaning && (
                    <div className="rounded bg-stone-400 px-1 py-0.5 text-[8px] text-white font-medium animate-in fade-in duration-500">
                      Cleaning
                    </div>
                  )}
                  {isSelection && hi === 1 && (
                    <div className="rounded border-2 border-blue-400 bg-blue-50 px-1 py-0.5 text-[8px] text-blue-700 font-medium animate-pulse">
                      Your booking
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Animated booking flow — shows the steps of making a booking
// ---------------------------------------------------------------------------
function BookingFlowDemo() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 4), 3000)
    return () => clearInterval(interval)
  }, [])

  const steps = [
    { label: 'Select time', content: (
      <div className="rounded-xl bg-stone-50 p-4">
        <p className="text-sm font-semibold text-stone-900">Apr 16, 2026, 2:00 PM</p>
        <p className="text-xs text-stone-500">Apr 16, 2026, 4:00 PM</p>
        <p className="mt-2 text-xs text-stone-500">Clubhouse</p>
        <p className="text-xs text-stone-500">Capacity: 50 guests</p>
      </div>
    )},
    { label: 'Fill details', content: (
      <div className="space-y-2">
        <div className="rounded-xl bg-stone-50 px-3 py-2"><p className="text-xs text-stone-400">Guest count</p><p className="text-sm text-stone-900">12</p></div>
        <div className="rounded-xl bg-stone-50 px-3 py-2"><p className="text-xs text-stone-400">Notes</p><p className="text-sm text-stone-900">Birthday party — need tables set up</p></div>
        <div className="flex items-center gap-2 text-xs text-stone-500"><span className="h-3 w-3 rounded border border-stone-300" /> Book anonymously</div>
      </div>
    )},
    { label: 'Review & submit', content: (
      <div className="rounded-xl border border-stone-200 p-3">
        <p className="text-[10px] uppercase tracking-wide text-stone-400 font-semibold">Booking Summary</p>
        <div className="mt-2 flex justify-between text-xs"><span className="text-stone-900 font-medium">Clubhouse</span><span className="text-emerald-600">Free</span></div>
        <div className="mt-1 text-xs text-stone-500">Apr 16, 2:00 PM – 4:00 PM</div>
        <div className="mt-3 rounded-full bg-emerald-600 py-2 text-center text-xs font-semibold text-white">Request Booking</div>
      </div>
    )},
    { label: 'Confirmed!', content: (
      <div className="text-center py-4">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="mt-2 text-sm font-semibold text-stone-900">Booking confirmed!</p>
        <p className="mt-1 text-xs text-stone-500">Confirmation email sent</p>
      </div>
    )},
  ]

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      {/* Step indicators */}
      <div className="flex gap-2 mb-4">
        {steps.map((s, i) => (
          <div key={s.label} className="flex-1">
            <div className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-emerald-500' : 'bg-stone-200'}`} />
            <p className={`mt-1 text-[10px] ${i === step ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>{s.label}</p>
          </div>
        ))}
      </div>
      {/* Content */}
      <div className="min-h-[140px] transition-all duration-500">
        {steps[step].content}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Email notification preview
// ---------------------------------------------------------------------------
function EmailDemo() {
  const [emailIdx, setEmailIdx] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setEmailIdx((i) => (i + 1) % 4), 3000)
    return () => clearInterval(interval)
  }, [])

  const emails = [
    { subject: 'Booking request received', preview: 'Hi Sarah, we\'ve received your booking request for Clubhouse at Sanctuary HOA.', color: 'border-l-blue-500' },
    { subject: 'Booking confirmed', preview: 'Your booking for Clubhouse at Sanctuary HOA is confirmed. We look forward to hosting your event!', color: 'border-l-emerald-500' },
    { subject: '48-hour reminder', preview: 'This is your reminder that your booking for Clubhouse at Sanctuary HOA is coming up in 48 hours.', color: 'border-l-amber-500' },
    { subject: 'Access instructions', preview: 'Your booking for Clubhouse is coming up in 1 hour. Gate code: 4521. Key is in the lockbox by the side entrance.', color: 'border-l-purple-500' },
  ]

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Automated emails</p>
      <div className="space-y-2">
        {emails.map((e, i) => (
          <div
            key={e.subject}
            className={`rounded-lg border-l-4 bg-stone-50 px-4 py-3 transition-all duration-500 ${e.color} ${
              i === emailIdx ? 'opacity-100 scale-100 shadow-sm' : 'opacity-50 scale-[0.98]'
            }`}
          >
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wide text-emerald-600 font-semibold">Neighbri</p>
              {i === emailIdx && <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] text-emerald-700 font-medium">Just sent</span>}
            </div>
            <p className="mt-1 text-sm font-medium text-stone-900">{e.subject}</p>
            <p className="mt-0.5 text-xs text-stone-500 line-clamp-1">{e.preview}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Cleaning automation demo
// ---------------------------------------------------------------------------
function CleaningDemo() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % 3), 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Cleaning automation</p>
      <div className="space-y-2">
        {/* Booking block */}
        <div className="rounded-lg bg-emerald-500 px-4 py-3 text-white">
          <p className="text-xs font-semibold">2:00 PM – 4:00 PM</p>
          <p className="text-[10px] opacity-80">Clubhouse — Smith Family</p>
        </div>
        {/* Cleaning block */}
        <div className={`rounded-lg px-4 py-3 transition-all duration-700 ${
          step === 0 ? 'bg-stone-300 text-stone-600' : step === 1 ? 'bg-stone-500 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <p className="text-xs font-semibold">
            4:00 PM – 5:00 PM
          </p>
          <p className="text-[10px] opacity-80">
            {step === 0 ? 'Cleaning (Default)' : step === 1 ? 'Cleaning (Confirmed by staff)' : 'Cleaning (Complete ✓)'}
          </p>
        </div>
        {/* Status */}
        <div className="flex items-center gap-2 pt-1">
          {['Auto-created', 'Staff confirms', 'Marked done'].map((label, i) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full transition-all duration-500 ${i <= step ? 'bg-emerald-500' : 'bg-stone-200'}`} />
              <span className={`text-[10px] ${i === step ? 'text-emerald-700 font-medium' : 'text-stone-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Insights preview
// ---------------------------------------------------------------------------
function InsightsDemo() {
  const bars = [
    { label: 'Clubhouse', pct: 85, color: 'bg-emerald-500' },
    { label: 'Pool', pct: 72, color: 'bg-blue-500' },
    { label: 'Tennis Court 1', pct: 58, color: 'bg-purple-500' },
    { label: 'Pickleball', pct: 45, color: 'bg-amber-500' },
    { label: 'Pavilion', pct: 30, color: 'bg-pink-500' },
  ]

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Most popular amenities</p>
      <div className="space-y-2.5">
        {bars.map((b, i) => (
          <div key={b.label}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-stone-700">{b.label}</span>
              <span className="text-xs font-semibold text-stone-900">{b.pct} bookings</span>
            </div>
            <div className="h-2 w-full rounded-full bg-stone-100">
              <div
                className={`h-2 rounded-full ${b.color} transition-all duration-1000`}
                style={{ width: `${b.pct}%`, transitionDelay: `${i * 200}ms` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      {/* Hero */}
      <section className="px-4 sm:px-6 pt-12 sm:pt-20 pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">How It Works</p>
          <h1 className="mt-4 text-3xl sm:text-5xl font-bold text-stone-900">
            See Neighbri in action
          </h1>
          <p className="mt-4 text-lg text-stone-500 max-w-xl mx-auto">
            From booking to cleanup — here&apos;s how your community&apos;s amenity management runs on autopilot.
          </p>
        </div>
      </section>

      {/* Section 1: Calendar */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">01</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">Real-time booking calendar</h2>
            <p className="mt-3 text-sm text-stone-500 leading-relaxed">
              Residents see live availability across all amenities. Drag to select a time, fill in the details,
              and submit — no phone calls, no spreadsheets. Bookings appear instantly for everyone.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Drag-to-book or click to pick a time</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Amenity tabs grouped by area</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Waitlist when slots are taken</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Works on mobile and desktop</li>
            </ul>
          </div>
          <CalendarDemo />
        </div>
      </section>

      {/* Section 2: Booking flow */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 gap-8 items-center">
          <div className="order-2 sm:order-1">
            <BookingFlowDemo />
          </div>
          <div className="order-1 sm:order-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">02</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">Simple 4-step booking</h2>
            <p className="mt-3 text-sm text-stone-500 leading-relaxed">
              Select a time, add details, review the summary, and submit. The booking flows through
              your approval workflow automatically — auto-approve small events or route to the PM for review.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Smart approval routing</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Stripe payments when applicable</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Anonymous booking option</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Rules acceptance before booking</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 3: Email notifications */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">03</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">Automated email notifications</h2>
            <p className="mt-3 text-sm text-stone-500 leading-relaxed">
              Residents and staff stay informed at every step — no manual follow-up needed. Branded
              emails go out automatically with the right information at the right time.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> Booking received</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Booking confirmed</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> 48-hour reminder</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-purple-500" /> Access instructions (1hr before)</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-stone-400" /> Post-event follow-up</li>
            </ul>
          </div>
          <EmailDemo />
        </div>
      </section>

      {/* Section 4: Cleaning automation */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 gap-8 items-center">
          <div className="order-2 sm:order-1">
            <CleaningDemo />
          </div>
          <div className="order-1 sm:order-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">04</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">Built-in cleaning automation</h2>
            <p className="mt-3 text-sm text-stone-500 leading-relaxed">
              Cleaning windows are created automatically after every booking. Janitorial staff see their
              schedule, confirm their window, and mark it complete — all within the platform.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Auto-created based on amenity turn time</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Staff drag-and-drop to adjust</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Residents see cleaning blocks in real-time</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Post-event inspection reports</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 5: Insights */}
      <section className="border-t border-stone-200 px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">05</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-900">Usage insights for the board</h2>
            <p className="mt-3 text-sm text-stone-500 leading-relaxed">
              See which amenities are most popular, busiest days of the week, peak booking hours,
              and 6-month trends. Data to make better decisions about your community&apos;s shared spaces.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Most popular amenities</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Busiest days and peak hours</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Booking trend over 6 months</li>
              <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Most active residents</li>
            </ul>
          </div>
          <InsightsDemo />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-200 bg-white px-4 sm:px-6 py-14 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Ready to see it for yourself?
          </h2>
          <p className="mt-3 text-stone-500">
            Start your 30-day free trial. Setup takes under 5 minutes.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="rounded-full border border-stone-300 px-8 py-3.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition"
            >
              View pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-stone-400">
            Residents join for free. Pricing is for communities managing their amenities.
          </p>
        </div>
      </section>
    </main>
  )
}
