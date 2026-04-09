'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Employee = {
  uid: string
  email: string
  displayName: string | undefined
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addEmail, setAddEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  async function loadEmployees() {
    try {
      const res = await fetch('/api/internal/employees')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setEmployees(data.employees ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEmployees() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addEmail.trim()) return
    setAdding(true)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/internal/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add')
      setNotice(`${addEmail} added as Neighbri employee.`)
      setAddEmail('')
      await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(uid: string, email: string) {
    if (!confirm(`Remove ${email} as a Neighbri employee? They will lose access to internal pages.`)) return
    setRemoving(uid)
    setNotice(null)
    setError(null)
    try {
      const res = await fetch('/api/internal/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove')
      setNotice(`${email} removed.`)
      await loadEmployees()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove')
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-purple-200 bg-purple-50">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-purple-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Internal
            </span>
            <h1 className="text-lg font-semibold text-stone-900">
              Platform Dashboard
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/internal" className="text-sm text-purple-700 hover:text-purple-900">
            &larr; Back to dashboard
          </Link>
          <h2 className="mt-2 text-xl font-bold text-stone-900">Neighbri Employees</h2>
          <p className="mt-1 text-sm text-stone-500">
            People with access to the internal platform dashboard. They can manage communities, users, and platform settings.
          </p>
        </div>

        {/* Add employee */}
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 mb-6">
          <p className="text-sm font-semibold text-purple-800 mb-3">Add Employee</p>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="employee@neighbri.com"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-purple-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-full bg-purple-700 px-5 py-2 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </form>
          <p className="mt-2 text-xs text-purple-500">
            The person must have an existing Neighbri account.
          </p>
        </div>

        {notice && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Employee list */}
        <div className="rounded-xl border border-stone-200 bg-white">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-stone-100" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="px-5 py-12 text-center text-stone-500">
              No employees configured.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {employees.map((emp) => (
                <div key={emp.uid} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {emp.displayName || emp.email}
                    </p>
                    {emp.displayName && (
                      <p className="text-xs text-stone-500">{emp.email}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(emp.uid, emp.email)}
                    disabled={removing === emp.uid}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {removing === emp.uid ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-stone-400">
          Employees must sign out and back in after being added for access to take effect.
        </p>
      </div>
    </div>
  )
}
