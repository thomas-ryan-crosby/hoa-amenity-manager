'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/* ------------------------------------------------------------------ */
/*  Step visual demos                                                  */
/* ------------------------------------------------------------------ */

function AmenityTabsDemo() {
  const [active, setActive] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a === 0 ? 1 : 0)), 2000)
    return () => clearInterval(id)
  }, [])
  const tabs = ['Clubroom', 'Pool']
  return (
    <div className="mt-3 flex items-end gap-2">
      {tabs.map((t, i) => (
        <div
          key={t}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors duration-300 ${
            i === active ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-500'
          }`}
        >
          {t}
        </div>
      ))}
      {/* Animated cursor */}
      <div
        className="absolute transition-all duration-500"
        style={{ left: active === 0 ? 28 : 112, bottom: 10 }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-stone-800 drop-shadow">
          <path fill="currentColor" d="M5.5 3.21V20.8l4.86-4.86h8.14L5.5 3.21z" />
        </svg>
      </div>
    </div>
  )
}

function ViewToggleDemo() {
  const [mode, setMode] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMode((m) => (m === 0 ? 1 : 0)), 1800)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="mt-3 inline-flex rounded-full border border-stone-200 overflow-hidden text-xs font-semibold">
      <div
        className={`px-4 py-1.5 transition-colors duration-300 ${
          mode === 0 ? 'bg-stone-800 text-white' : 'bg-white text-stone-500'
        }`}
      >
        Calendar
      </div>
      <div
        className={`px-4 py-1.5 transition-colors duration-300 ${
          mode === 1 ? 'bg-stone-800 text-white' : 'bg-white text-stone-500'
        }`}
      >
        List
      </div>
    </div>
  )
}

function NavigateDatesDemo() {
  const months = ['Mar 2026', 'Apr 2026', 'May 2026']
  const [idx, setIdx] = useState(1)
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % months.length), 1500)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="mt-3 flex items-center justify-center gap-4 text-sm font-semibold text-stone-700">
      <button className="rounded-full border border-stone-300 w-7 h-7 flex items-center justify-center text-stone-500 hover:bg-stone-100">
        &lt;
      </button>
      <span className="w-24 text-center transition-all duration-300">{months[idx]}</span>
      <button className="rounded-full border border-stone-300 w-7 h-7 flex items-center justify-center text-stone-500 hover:bg-stone-100">
        &gt;
      </button>
    </div>
  )
}

function ColorLegendDemo() {
  const items = [
    { color: 'bg-pink-400', label: 'New request' },
    { color: 'bg-amber-400', label: 'Pending approval' },
    { color: 'bg-emerald-500', label: 'Confirmed' },
    { color: 'bg-blue-400', label: 'Waitlisted' },
    { color: 'bg-stone-400', label: 'Cleaning window' },
  ]
  return (
    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-stone-600">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${it.color}`} />
          {it.label}
        </div>
      ))}
    </div>
  )
}

function DragToBookDemo() {
  return (
    <div className="relative bg-stone-50 rounded-xl p-3 mt-3 h-32 overflow-hidden">
      {/* Time labels */}
      <div className="space-y-4 text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <span className="w-12">10 AM</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12">11 AM</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12">12 PM</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-12">1 PM</span>
          <div className="flex-1 border-t border-stone-200" />
        </div>
      </div>
      {/* Animated selection highlight */}
      <div className="absolute left-16 right-3 top-3 animate-tutorial-drag rounded bg-emerald-100 border-2 border-dashed border-emerald-400" />
      {/* Animated cursor */}
      <div className="absolute animate-tutorial-cursor">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-stone-900 drop-shadow">
          <path fill="currentColor" d="M5.5 3.21V20.8l4.86-4.86h8.14L5.5 3.21z" />
        </svg>
      </div>
      {/* Confirmation badge that fades in */}
      <div className="absolute bottom-2 right-3 animate-tutorial-confirm rounded-full bg-emerald-600 text-white text-[10px] font-semibold px-2.5 py-1 flex items-center gap-1">
        <span>&#10003;</span> 10:00 AM &ndash; 12:00 PM
      </div>
    </div>
  )
}

function BookingFormDemo() {
  return (
    <div className="mt-3 bg-stone-50 rounded-xl p-3 text-sm">
      <div className="font-semibold text-stone-900">Clubroom</div>
      <div className="text-xs text-stone-500 mt-1">Apr 15, 10:00 AM &ndash; 12:00 PM</div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-stone-600">Guests:</span>
        <span className="rounded bg-white border border-stone-300 px-2 py-0.5 text-xs">5</span>
      </div>
      <button className="mt-3 w-full rounded-full bg-emerald-600 py-2 text-xs font-semibold text-white pointer-events-none">
        Confirm Booking
      </button>
    </div>
  )
}

function MyBookingsDemo() {
  return (
    <div className="mt-3 bg-stone-50 rounded-xl p-3 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-stone-900">Clubroom</div>
          <div className="text-xs text-stone-500 mt-0.5">Apr 15, 10:00 AM &ndash; 12:00 PM</div>
        </div>
        <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold px-2.5 py-1">
          Confirmed
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Steps definition                                                   */
/* ------------------------------------------------------------------ */

interface TutorialStep {
  title: string
  description: string
  target: string
  demo: React.FC
}

const STEPS: TutorialStep[] = [
  {
    title: 'Choose an amenity',
    description:
      'Tap an amenity to see its calendar. Shift+click to view multiple at once.',
    target: 'amenity-tabs',
    demo: AmenityTabsDemo,
  },
  {
    title: 'Switch views',
    description: 'Switch between calendar and list views.',
    target: 'view-toggle',
    demo: ViewToggleDemo,
  },
  {
    title: 'Navigate dates',
    description:
      'Use arrows to navigate. Click a day in month view to zoom into the week.',
    target: 'calendar-grid',
    demo: NavigateDatesDemo,
  },
  {
    title: 'Color legend',
    description: 'Each color shows booking status at a glance.',
    target: 'color-legend',
    demo: ColorLegendDemo,
  },
  {
    title: 'Drag to book',
    description:
      'Click and drag to select your time. On mobile, tap and hold.',
    target: 'calendar-grid',
    demo: DragToBookDemo,
  },
  {
    title: 'Booking form',
    description:
      "Fill in your details and submit. You'll get an email confirmation.",
    target: 'booking-form',
    demo: BookingFormDemo,
  },
  {
    title: 'Track bookings',
    description:
      'View, modify, or cancel your bookings anytime from My Bookings.',
    target: 'nav-my-bookings',
    demo: MyBookingsDemo,
  },
]

const STORAGE_KEY = 'tutorial-completed'

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function Tutorial({
  externalOpen,
  onClose,
}: {
  externalOpen?: boolean
  onClose?: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [entering, setEntering] = useState(false)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)
  const [cardPos, setCardPos] = useState<
    { top?: number; bottom?: number; left: number; centered: boolean }
  >({ left: 0, centered: true })
  const cardRef = useRef<HTMLDivElement>(null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  function findTarget(target: string): HTMLElement | null {
    return document.querySelector(`[data-tutorial="${target}"]`)
  }

  const updateHighlight = useCallback(() => {
    const step = STEPS[currentStep]
    const el = findTarget(step.target)

    if (!el) {
      setHighlightRect(null)
      setCardPos({ left: 0, centered: true })
      return
    }

    const rect = el.getBoundingClientRect()
    setHighlightRect(rect)

    // On mobile, always center the card
    if (window.innerWidth < 640) {
      setCardPos({ left: 0, centered: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      return
    }

    const pad = 8
    const cardWidth = 380
    const cardEstHeight = 320 // conservative estimate
    const vpH = window.innerHeight

    // Horizontal centering on the target, clamped to viewport
    let left = rect.left + rect.width / 2 - cardWidth / 2
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16))

    const spaceBelow = vpH - (rect.bottom + pad + 12)
    const spaceAbove = rect.top - pad - 12

    if (spaceBelow >= cardEstHeight) {
      // Position below
      setCardPos({ top: rect.bottom + pad + 12, left, centered: false })
    } else if (spaceAbove >= cardEstHeight) {
      // Position above
      setCardPos({
        bottom: vpH - rect.top + pad + 12,
        left,
        centered: false,
      })
    } else {
      // Not enough room either way — center and just show the red box
      setCardPos({ left: 0, centered: true })
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [currentStep])

  // Scroll card into view after positioning
  useEffect(() => {
    if (!isOpen || !cardRef.current) return
    const timer = setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 350)
    return () => clearTimeout(timer)
  }, [isOpen, currentStep])

  // Auto-open for first-time visitors
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => {
        setCurrentStep(0)
        setIsOpen(true)
        requestAnimationFrame(() => setEntering(true))
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  // Respond to external open trigger
  useEffect(() => {
    if (externalOpen) {
      setCurrentStep(0)
      setIsOpen(true)
      requestAnimationFrame(() => setEntering(true))
    }
  }, [externalOpen])

  // Update highlight when step changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(updateHighlight, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentStep, updateHighlight])

  // Update on scroll/resize
  useEffect(() => {
    if (!isOpen) return
    const handler = () => updateHighlight()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [isOpen, updateHighlight])

  const finish = useCallback(() => {
    setEntering(false)
    setHighlightRect(null)
    setTimeout(() => {
      setIsOpen(false)
      setCurrentStep(0)
      localStorage.setItem(STORAGE_KEY, '1')
      onClose?.()
    }, 200)
  }, [onClose])

  const next = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      finish()
    }
  }, [currentStep, finish])

  const prev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  // Keyboard support
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish()
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, next, prev, finish])

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const StepDemo = step.demo
  const isLast = currentStep === STEPS.length - 1
  const pad = 8

  // Build card style
  let cardStyle: React.CSSProperties = {}
  if (!cardPos.centered) {
    cardStyle = { position: 'fixed', left: cardPos.left }
    if (cardPos.top !== undefined) cardStyle.top = cardPos.top
    if (cardPos.bottom !== undefined) cardStyle.bottom = cardPos.bottom
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-200 ${
          entering ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={finish}
        aria-hidden="true"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      />

      {/* Red highlight box */}
      {highlightRect && (
        <div
          className="fixed z-[65] pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: highlightRect.top - pad,
            left: highlightRect.left - pad,
            width: highlightRect.width + pad * 2,
            height: highlightRect.height + pad * 2,
            border: '3px solid #EF4444',
            borderRadius: 12,
            boxShadow:
              '0 0 0 9999px rgba(0,0,0,0.45), 0 0 20px rgba(239,68,68,0.3)',
          }}
        />
      )}

      {/* Tutorial card */}
      <div
        ref={cardRef}
        className={`fixed z-[70] w-[calc(100%-2rem)] max-w-sm transition-all duration-200 ${
          entering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${cardPos.centered ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
        style={!cardPos.centered ? cardStyle : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200 max-h-[80vh] overflow-y-auto">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <button
              onClick={finish}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              Skip tutorial
            </button>
          </div>

          {/* Title & description */}
          <h3 className="text-lg font-semibold text-stone-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {step.description}
          </p>

          {/* Animated visual demo */}
          <div className="relative">
            <StepDemo />
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                    i === currentStep
                      ? 'bg-emerald-500'
                      : i < currentStep
                        ? 'bg-emerald-200'
                        : 'bg-stone-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prev}
                  className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                {isLast ? 'Get started!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
