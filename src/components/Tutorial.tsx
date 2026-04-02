'use client'

import { useState, useEffect, useCallback } from 'react'

interface TutorialStep {
  title: string
  description: string
  position: 'top' | 'bottom' | 'center'
  arrowDirection?: 'up' | 'down' | 'none'
}

const STEPS: TutorialStep[] = [
  {
    title: 'Choose an amenity',
    description:
      'Select an amenity tab to view its calendar. You can shift+click to view multiple amenities at the same time.',
    position: 'bottom',
    arrowDirection: 'up',
  },
  {
    title: 'Browse the calendar',
    description:
      'Use the month view to see an overview, then click any day to zoom into the week view. Use the arrows to navigate between weeks.',
    position: 'center',
    arrowDirection: 'none',
  },
  {
    title: 'Select a time slot',
    description:
      'Click and drag on the calendar to select your desired time slot. On mobile, tap and hold to start a selection.',
    position: 'center',
    arrowDirection: 'none',
  },
  {
    title: 'Fill in your details',
    description:
      'Enter your guest count and any notes. If the amenity has rules, you\'ll need to accept them. Check "Book anonymously" if you don\'t want your name shown on the public calendar.',
    position: 'center',
    arrowDirection: 'none',
  },
  {
    title: 'Submit your request',
    description:
      'Click "Confirm Booking" to submit your request. You\'ll receive an email confirmation and can track your booking status in "My Bookings".',
    position: 'center',
    arrowDirection: 'none',
  },
  {
    title: 'Track your bookings',
    description:
      'View all your reservations from the "My Bookings" link in the navigation bar. You can modify upcoming bookings or cancel if plans change.',
    position: 'bottom',
    arrowDirection: 'up',
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

  // Auto-open for first-time visitors
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY)
    if (!completed) {
      const timer = setTimeout(() => {
        setCurrentStep(0)
        setIsOpen(true)
        requestAnimationFrame(() => setEntering(true))
      }, 1000)
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

  const finish = useCallback(() => {
    setEntering(false)
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
      if (e.key === 'Escape') {
        finish()
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
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
  const isLast = currentStep === STEPS.length - 1

  // Position the card based on the step
  const positionClasses = (() => {
    switch (step.position) {
      case 'top':
        return 'top-24 left-1/2 -translate-x-1/2'
      case 'bottom':
        return 'top-28 left-1/2 -translate-x-1/2 sm:top-24'
      case 'center':
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
    }
  })()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${
          entering ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={finish}
        aria-hidden="true"
      />

      {/* Tutorial card */}
      <div
        className={`fixed z-[70] ${positionClasses} w-[calc(100%-2rem)] max-w-sm transition-all duration-200 ${
          entering
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial step ${currentStep + 1} of ${STEPS.length}`}
      >
        {/* Arrow pointing up */}
        {step.arrowDirection === 'up' && (
          <div className="mx-auto mb-[-1px] flex justify-center">
            <div className="h-3 w-3 rotate-45 rounded-sm bg-white" />
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
          {/* Header row */}
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

          {/* Step icon */}
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            {currentStep === 0 && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            )}
            {currentStep === 1 && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            {currentStep === 2 && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            )}
            {currentStep === 3 && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
            {currentStep === 4 && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {currentStep === 5 && (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            )}
          </div>

          {/* Title & description */}
          <h3 className="text-lg font-semibold text-stone-900">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {step.description}
          </p>

          {/* Footer: dots + buttons */}
          <div className="mt-5 flex items-center justify-between">
            {/* Progress dots */}
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

            {/* Navigation buttons */}
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={prev}
                  className="rounded-full border border-stone-300 px-4 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-stone-50"
                >
                  Back
                </button>
              )}
              <button
                onClick={next}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold text-white transition ${
                  isLast
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {isLast ? 'Get started' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Arrow pointing down */}
        {step.arrowDirection === 'down' && (
          <div className="mx-auto mt-[-1px] flex justify-center">
            <div className="h-3 w-3 rotate-45 rounded-sm bg-white" />
          </div>
        )}
      </div>
    </>
  )
}
