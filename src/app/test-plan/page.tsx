import Link from 'next/link'

const SECTIONS = [
  {
    title: 'Getting Started',
    time: '5 min',
    steps: [
      { action: 'Go to neighbri.com and read the homepage', check: 'Does it clearly explain what Neighbri does? Is the value proposition clear?' },
      { action: 'Click "Features" in the nav', check: 'Do the features make sense? Anything confusing or missing?' },
      { action: 'Click "How It Works"', check: 'Do the animated demos help you understand the product? Are they smooth?' },
      { action: 'Click "Pricing"', check: 'Are the tiers clear? Do you understand what you get at each level?' },
    ],
  },
  {
    title: 'Account Creation',
    time: '3 min',
    steps: [
      { action: 'Click "Get started free" or "Start free trial" to go to the sign-up page', check: 'Is the sign-up form simple and clear?' },
      { action: 'Create an account with your real email and a password', check: 'Did the password visibility toggle (eye icon) work? Did you receive a welcome email?' },
      { action: 'After sign-up, you should see a "What brings you here?" screen', check: 'Are the three options clear (resident, manage community, book as guest)?' },
    ],
  },
  {
    title: 'Join a Community (Resident Flow)',
    time: '3 min',
    steps: [
      { action: 'Click "I\'m a resident"', check: 'Does the join page load correctly?' },
      { action: 'Enter zip code 70471 (Mandeville) and click Search', check: 'Does Sanctuary HOA appear in the results?' },
      { action: 'Select Sanctuary HOA and click "Request to join"', check: 'Did you see a success message? Were you redirected?' },
      { action: 'You should now see a "pending approval" screen', check: 'Is the pending message clear? Does it say who to contact?' },
    ],
  },
  {
    title: 'Booking Calendar (after approval)',
    time: '10 min',
    note: 'Ask Thomas to approve your account first, then continue.',
    steps: [
      { action: 'Navigate to the booking calendar (click "Book" in the nav)', check: 'Does the calendar load? Do you see the amenity tabs at the top?' },
      { action: 'Check the timezone note above the calendar', check: 'Does it show "All times shown in Chicago time" (or whatever the community timezone is)?' },
      { action: 'Switch between Day, Week, and Month views', check: 'Do all views work? Does the sticky header stay at the top when scrolling in week view?' },
      { action: 'Click a date in Month view to jump to week view', check: 'Does the selected date land in the center of the week? Did the column glow briefly?' },
      { action: 'Click on an empty time slot on the calendar', check: 'Does a time picker popup appear? Can you adjust the start and end times?' },
      { action: 'Drag across multiple time slots to select a range', check: 'Does a blue selection block appear? Does the booking form show on the right sidebar (desktop) or bottom sheet (mobile)?' },
      { action: 'If the amenity has a cleaning time configured, check for a gray "Cleaning" block', check: 'Does a cleaning block preview appear right after your booking end time?' },
      { action: 'Fill in the guest count and notes, then click "Request Booking"', check: 'Did the booking submit? Did you receive a "Booking request received" email?' },
      { action: 'Try to book a date far in the future (90+ days out)', check: 'Does a red message appear saying the date is too far in advance? Is the submit button disabled?' },
      { action: 'Click on an existing booking on the calendar', check: 'Does a popup show with the booking details and Firestore ID at the bottom?' },
      { action: 'Go to "My Bookings" in the nav', check: 'Does your booking appear in the list?' },
    ],
  },
  {
    title: 'Mobile Experience',
    time: '5 min',
    note: 'Open neighbri.com on your phone or resize your browser window to mobile width.',
    steps: [
      { action: 'Open the hamburger menu', check: 'Do all nav links appear? Does the community switcher work?' },
      { action: 'Navigate to the booking calendar on mobile', check: 'Does the calendar show in day view? Can you swipe/scroll through time slots?' },
      { action: 'Tap on a time slot to start a booking', check: 'Does the mobile bottom sheet appear with the booking form?' },
      { action: 'Complete a booking on mobile', check: 'Did the booking submit successfully? Is the flow usable on a small screen?' },
    ],
  },
  {
    title: 'Email Notifications',
    time: '5 min',
    steps: [
      { action: 'Check your email for the welcome email after sign-up', check: 'Did it arrive? Is it branded with Neighbri? Does it look professional?' },
      { action: 'Check for the "Booking request received" email after creating a booking', check: 'Are the times correct and in the community timezone? Is the community name shown?' },
      { action: 'If your booking was auto-confirmed, check for the "Booking confirmed" email', check: 'Did it arrive? Are the booking details accurate?' },
      { action: 'Check the booking summary table in any email', check: 'Does it show Community, Amenity, When, Guests? Does it say "All times are in [timezone] time"?' },
    ],
  },
  {
    title: 'Community Switching',
    time: '3 min',
    note: 'Only if you belong to multiple communities.',
    steps: [
      { action: 'Click the community name dropdown in the navbar', check: 'Do you see all your communities listed with role badges?' },
      { action: 'Switch to a different community', check: 'Did the page reload cleanly with a spinner (no flashing between screens)? Did the calendar show the new community\'s amenities?' },
      { action: 'Switch back to the original community', check: 'Is all the data correct for the original community?' },
    ],
  },
  {
    title: 'Account Settings',
    time: '2 min',
    steps: [
      { action: 'Click your name in the nav to go to Account', check: 'Does your role show correctly? Is your email displayed?' },
      { action: 'Update your phone number and click Save', check: 'Did it save successfully? Does a notice appear?' },
      { action: 'Go to the sign-in page and click "Forgot password?"', check: 'Enter your email — did you receive a password reset email from Neighbri (not Firebase)?' },
    ],
  },
  {
    title: 'Error Handling',
    time: '3 min',
    steps: [
      { action: 'Try to visit neighbri.com/some-page-that-doesnt-exist', check: 'Do you see a branded 404 page with links to go home or book?' },
      { action: 'Sign out and try to access neighbri.com/resident directly', check: 'Are you redirected to the sign-in page?' },
      { action: 'Sign in and try to access neighbri.com/admin/dashboard without admin permissions', check: 'Do you see a Forbidden error or are you blocked appropriately?' },
    ],
  },
  {
    title: 'Overall Feedback',
    time: '5 min',
    steps: [
      { action: 'Rate the overall experience from 1-10', check: 'How intuitive was the platform? What would make it a 10?' },
      { action: 'What was the most confusing part of the experience?', check: 'Where did you get stuck or have to think twice?' },
      { action: 'What feature would you most want to see added?', check: 'What\'s missing that would make you recommend this to your HOA?' },
      { action: 'Would you recommend Neighbri to your HOA board?', check: 'Why or why not? What would change your answer?' },
      { action: 'Any bugs, visual glitches, or broken links you noticed?', check: 'Note the page, what you clicked, and what happened vs. what you expected.' },
    ],
  },
]

export default function TestPlanPage() {
  return (
    <main className="min-h-screen bg-stone-50 px-4 sm:px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-emerald-700 hover:text-emerald-900">&larr; Back to Neighbri</Link>

        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Beta Test Plan</p>
          <h1 className="mt-3 text-3xl font-bold text-stone-900">Help us launch Neighbri</h1>
          <p className="mt-3 text-sm text-stone-500 leading-relaxed">
            Thank you for being a beta tester! This plan walks you through every core feature of Neighbri.
            It should take about <strong>45 minutes</strong> to complete. Your feedback is invaluable — please note
            any bugs, confusing moments, or ideas for improvement as you go.
          </p>
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-300 px-5 py-4 text-sm text-amber-900">
            <p className="font-semibold">A note about payments during testing:</p>
            <ul className="mt-2 space-y-1 text-amber-800">
              <li>&bull; <strong>Subscriptions are fine</strong> — all plans have a 30-day free trial. Your trial will be cancelled after testing, so you won&apos;t be charged.</li>
              <li>&bull; <strong>Skip amenity payments</strong> — if a booking asks for payment via Stripe checkout, skip that step and note it in your feedback. Only book free amenities during testing.</li>
            </ul>
          </div>

          <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            <strong>How to submit feedback:</strong> Reply to the email that sent you this link, or email{' '}
            <a href="mailto:support@neighbri.com" className="underline">support@neighbri.com</a> with your notes.
            Screenshots are very helpful!
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((section, si) => (
            <div key={section.title}>
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {si + 1}
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">{section.title}</h2>
                  <p className="text-xs text-stone-400">~{section.time}</p>
                </div>
              </div>
              {section.note && (
                <div className="mb-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs text-amber-700">
                  {section.note}
                </div>
              )}
              <div className="space-y-3">
                {section.steps.map((step, i) => (
                  <div key={i} className="rounded-xl border border-stone-200 bg-white p-4">
                    <div className="flex gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-500 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-stone-900">{step.action}</p>
                        <p className="mt-1 text-xs text-stone-500 italic">{step.check}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-stone-900 p-8 text-center">
          <h2 className="text-xl font-bold text-white">Thank you!</h2>
          <p className="mt-2 text-sm text-stone-400">
            Your feedback directly shapes the product. We read every response.
          </p>
          <a
            href="mailto:support@neighbri.com?subject=Beta Test Feedback"
            className="mt-4 inline-block rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Submit your feedback
          </a>
        </div>
      </div>
    </main>
  )
}
