'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface TutorialStep {
  title: string
  description: string
  target: string // data-tutorial attribute value to highlight
  cardPosition: 'below' | 'above' | 'center'
}

const STEPS: TutorialStep[] = [
  {
    title: 'Choose an amenity',
    description: 'Select an amenity tab to view its calendar. You can shift+click to view multiple amenities at the same time. Amenities are grouped by area.',
    target: 'amenity-tabs',
    cardPosition: 'below',
  },
  {
    title: 'Switch calendar views',
    description: 'Toggle between Calendar view and List view. Calendar shows a visual grid, List shows bookings as cards sorted by date.',
    target: 'view-toggle',
    cardPosition: 'below',
  },
  {
    title: 'Navigate dates',
    description: 'Use the < > arrow buttons at the top of the calendar to move forward or back. Click "today" to jump to the current date. Switch between day, week, and month views with the buttons on the right.',
    target: 'calendar-grid',
    cardPosition: 'above',
  },
  {
    title: 'Understand the color legend',
    description: 'Each color represents a booking status. Pink = new request, amber = pending approval, green = confirmed, blue = waitlisted, gray = cleaning window.',
    target: 'color-legend',
    cardPosition: 'below',
  },
  {
    title: 'Select a time slot',
    description: 'Click and drag on the week/day view to select your desired time. On mobile, tap and hold to start. The selected time will appear in the booking form.',
    target: 'calendar-grid',
    cardPosition: 'above',
  },
  {
    title: 'Also book together',
    description: 'Some amenities suggest booking others at the same time (e.g., Clubroom + Pool). If suggestions appear, check the ones you want — they\'ll be booked for the same time.',
    target: 'booking-form',
    cardPosition: 'center',
  },
  {
    title: 'Fill details & submit',
    description: 'Enter guest count, notes, and accept any rules. Check "Book anonymously" to hide your name on the public calendar. Then click "Confirm Booking" to submit.',
    target: 'booking-form',
    cardPosition: 'center',
  },
  {
    title: 'Track your bookings',
    description: 'Click "My Bookings" in the navigation bar to see all your reservations. You can modify upcoming bookings or cancel if plans change.',
    target: 'nav-my-bookings',
    cardPosition: 'below',
  },
]

const STORAGE_KEY = 'tutorial-completed'

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
  const cardRef = useRef<HTMLDivElement>(null)

  function findTarget(target: string): HTMLElement | null {
    return document.querySelector(`[data-tutorial="${target}"]`)
  }

  function updateHighlight() {
    const step = STEPS[currentStep]
    const el = findTarget(step.target)
    if (el) {
      const rect = el.getBoundingClientRect()
      setHighlightRect(rect)
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      setHighlightRect(null)
    }
  }

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
      // Small delay to let DOM settle
      const timer = setTimeout(updateHighlight, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, currentStep])

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
  }, [isOpen, currentStep])

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
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); prev() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, next, prev, finish])

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const isLast = currentStep === STEPS.length - 1
  const pad = 8 // padding around the highlight

  // Calculate card position
  let cardStyle: React.CSSProperties = {}
  if (highlightRect && step.cardPosition !== 'center') {
    const cardWidth = 380
    let left = highlightRect.left + highlightRect.width / 2 - cardWidth / 2
    left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16))

    if (step.cardPosition === 'below') {
      cardStyle = { position: 'fixed', top: highlightRect.bottom + pad + 12, left }
    } else {
      cardStyle = { position: 'fixed', bottom: window.innerHeight - highlightRect.top + pad + 12, left }
    }
  }

  return (
    <>
      {/* Backdrop with cutout */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-200 ${entering ? 'opacity-100' : 'opacity-0'}`}
        onClick={finish}
        aria-hidden="true"
        style={{
          background: highlightRect
            ? `linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.5))`
            : 'rgba(0,0,0,0.5)',
        }}
      />

      {/* Red highlight box around target */}
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
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.45), 0 0 20px rgba(239,68,68,0.3)',
          }}
        />
      )}

      {/* Tutorial card */}
      <div
        ref={cardRef}
        className={`fixed z-[70] w-[calc(100%-2rem)] max-w-sm transition-all duration-200 ${
          entering ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        } ${!highlightRect || step.cardPosition === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
        style={highlightRect && step.cardPosition !== 'center' ? cardStyle : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <button onClick={finish} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">
              Skip tutorial
            </button>
          </div>

          {/* Title & description */}
          <h3 className="text-lg font-semibold text-stone-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.description}</p>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                    i === currentStep ? 'bg-emerald-500' : i < currentStep ? 'bg-emerald-200' : 'bg-stone-200'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button onClick={prev} className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
                  Back
                </button>
              )}
              <button onClick={next} className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500">
                {isLast ? 'Get started!' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
