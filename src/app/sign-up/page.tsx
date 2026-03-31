'use client'

import { useState } from 'react'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { getClientAuth } from '@/lib/firebase/client'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user } = await createUserWithEmailAndPassword(getClientAuth(), email, password)
      await updateProfile(user, { displayName: name })
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Sanctuary Booking</p>
        <h1 className="mt-3 text-3xl font-semibold text-stone-900">Create account</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-stone-700">
            Full name
            <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-500" type="text" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Email
            <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-500" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Password
            <input className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-500" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <button className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:bg-emerald-300" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          Already have an account? <a className="text-emerald-700 font-medium" href="/sign-in">Sign in</a>
        </p>
      </div>
    </main>
  )
}
