'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function AccountPage() {
  const { user, role } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/account')
        if (!res.ok) return
        const data = await res.json()
        const p = data.profile
        setName(p.name ?? '')
        setEmail(p.email ?? '')
        setPhone(p.phone ?? '')
        setUnitNumber(p.unitNumber ?? '')
      } catch (err) {
        console.error('Failed to load profile', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone || null, unitNumber }),
      })
      if (!res.ok) {
        const data = await res.json()
        setNotice(data.error ?? 'Unable to save.')
        return
      }
      setNotice('Profile updated.')
    } catch {
      setNotice('Unable to save.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-stone-50 px-6 py-8">
        <div className="mx-auto max-w-xl">
          <div className="h-96 animate-pulse rounded-3xl bg-stone-100" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-8">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-stone-900">
          Personal settings
        </h1>

        {notice && (
          <div className="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {notice}
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          {/* Read-only info */}
          <div className="mb-6 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
            <div className="flex items-center justify-between">
              <span className="font-medium text-stone-900">{user?.displayName ?? name}</span>
              {role && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  {role.replaceAll('_', ' ')}
                </span>
              )}
            </div>
            <p className="mt-1 text-stone-500">{user?.email ?? email}</p>
            <p className="mt-2 text-xs text-stone-400">
              Email is managed through your login credentials and cannot be changed here.
            </p>
          </div>

          {/* Editable fields */}
          <form className="space-y-4" onSubmit={handleSave}>
            <label className="block text-sm font-medium text-stone-700">
              Full name
              <input
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="block text-sm font-medium text-stone-700">
              Phone number
              <input
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-stone-700">
              Unit / address
              <input
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400"
                placeholder="e.g. Unit 204, 123 Main St"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
              />
            </label>

            <button
              className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:bg-stone-400"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="mt-6 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stone-900">Account details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-stone-500">Email</dt>
              <dd className="text-stone-900">{email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Role</dt>
              <dd className="text-stone-900">{role?.replaceAll('_', ' ') ?? 'resident'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-stone-500">Firebase UID</dt>
              <dd className="font-mono text-xs text-stone-400">{user?.uid ?? '—'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  )
}
