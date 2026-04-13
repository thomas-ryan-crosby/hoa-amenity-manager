'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getClientAuth } from '@/lib/firebase/client'
import { friendlyAuthError } from '@/lib/firebase/authErrors'
import { markSessionHandled } from '@/components/providers/AuthProvider'
import { PasswordInput } from '@/components/PasswordInput'

type Path = 'join' | 'create' | 'browse'

const PATH_OPTIONS: { value: Path; title: string; description: string; icon: string }[] = [
  {
    value: 'join',
    title: 'Join a community',
    description: 'I live in an HOA or community that\'s on Neighbri (or ready to be).',
    icon: '🏡',
  },
  {
    value: 'create',
    title: 'I manage a community',
    description: 'I\'m a property manager or HOA board member setting up a new community.',
    icon: '🔑',
  },
  {
    value: 'browse',
    title: 'Just browsing',
    description: 'I want to see what amenities are available to book publicly.',
    icon: '👀',
  },
]

export default function SignUpPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [path, setPath] = useState<Path | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handlePathSelect(selected: Path) {
    setPath(selected)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!path) return
    setLoading(true)
    setError('')
    try {
      markSessionHandled()
      const { user } = await createUserWithEmailAndPassword(getClientAuth(), email, password)
      await updateProfile(user, { displayName: name })

      const idToken = await user.getIdToken()

      // Create resident record + send welcome email
      const res = await fetch('/api/auth/sign-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, name }),
      })

      if (!res.ok) {
        console.error('Failed to create resident record:', await res.text())
      }

      // Force token refresh to pick up the new custom claims
      const freshToken = await user.getIdToken(true)

      // Create session cookie with the fresh token that includes the role
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: freshToken }),
      })

      if (!sessionRes.ok) {
        console.error('Session creation failed:', sessionRes.status)
      }

      // Route to the path-specific next step
      if (path === 'join') {
        window.location.href = '/join'
      } else if (path === 'create') {
        window.location.href = '/onboard'
      } else {
        window.location.href = '/browse'
      }
    } catch (err) {
      setError(friendlyAuthError(err, 'Sign up failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Neighbri</p>

        {step === 1 && (
          <>
            <h1 className="mt-3 text-3xl font-semibold text-stone-900">What brings you here?</h1>
            <p className="mt-2 text-sm text-stone-500">Pick the option that fits best. You can switch later.</p>
            <div className="mt-6 space-y-3">
              {PATH_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePathSelect(opt.value)}
                  className="group w-full rounded-2xl border border-stone-200 bg-white p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl" aria-hidden>{opt.icon}</div>
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-stone-900 group-hover:text-emerald-800">{opt.title}</h2>
                      <p className="mt-1 text-sm text-stone-500 leading-relaxed">{opt.description}</p>
                    </div>
                    <svg className="mt-1 h-5 w-5 text-stone-300 group-hover:text-emerald-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-sm text-stone-500">
              Already have an account? <Link className="text-emerald-700 font-medium" href="/sign-in">Sign in</Link>
            </p>
          </>
        )}

        {step === 2 && path && (
          <>
            <button
              type="button"
              onClick={() => { setStep(1); setError('') }}
              className="mt-3 text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Change
            </button>
            <h1 className="mt-2 text-3xl font-semibold text-stone-900">Create your account</h1>
            <p className="mt-2 text-sm text-stone-500">
              Continuing as: <span className="font-medium text-stone-700">
                {PATH_OPTIONS.find((o) => o.value === path)?.title}
              </span>
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-stone-700">
                Full name
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-emerald-500"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Email
                <input
                  className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-stone-900 outline-none focus:border-emerald-500"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </label>
              <div>
                <span className="text-sm font-medium text-stone-700">Password</span>
                <PasswordInput value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <label className="flex items-start gap-3 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded"
                  required
                />
                <span>
                  I agree to the <a href="/terms" target="_blank" className="text-emerald-600 underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-emerald-600 underline">Privacy Policy</a>
                </span>
              </label>
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}
              <button
                className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300"
                type="submit"
                disabled={loading || !agreed}
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-stone-500">
              Already have an account? <Link className="text-emerald-700 font-medium" href="/sign-in">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
