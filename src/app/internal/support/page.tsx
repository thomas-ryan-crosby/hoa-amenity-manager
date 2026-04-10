'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Ticket = {
  id: string
  emailId: string
  from: string
  to: string[]
  cc: string[]
  subject: string
  body: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  notes: string
  receivedAt: string
  updatedAt: string
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-50 text-red-700',
  in_progress: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  closed: 'bg-stone-100 text-stone-500',
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
}

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved' | 'closed'>('all')

  async function loadTickets() {
    try {
      const res = await fetch('/api/internal/tickets')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setTickets(data.tickets ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTickets() }, [])

  function selectTicket(t: Ticket) {
    setSelectedTicket(t)
    setNotes(t.notes)
  }

  async function updateTicket(status?: string, updatedNotes?: string) {
    if (!selectedTicket) return
    setSaving(true)
    try {
      const body: Record<string, string> = { id: selectedTicket.id }
      if (status) body.status = status
      if (updatedNotes !== undefined) body.notes = updatedNotes

      const res = await fetch('/api/internal/tickets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update')
      await loadTickets()
      // Update selected ticket
      setSelectedTicket((prev) => prev ? { ...prev, ...(status ? { status: status as Ticket['status'] } : {}), ...(updatedNotes !== undefined ? { notes: updatedNotes } : {}) } : null)
    } catch {
      setError('Failed to update ticket')
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? tickets : tickets.filter((t) => t.status === filter)
  const openCount = tickets.filter((t) => t.status === 'open').length

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-purple-200 bg-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-purple-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Internal
            </span>
            <h1 className="text-lg font-semibold text-stone-900">Platform Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/internal" className="text-sm text-purple-700 hover:text-purple-900">
            &larr; Back to dashboard
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-xl font-bold text-stone-900">Support Tickets</h2>
            {openCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                {openCount} open
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Emails received at support@neighbri.com appear here as tickets.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Filter tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                filter === f ? 'bg-purple-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f === 'all' ? 'All' : STATUS_LABELS[f]}
              {f === 'open' && openCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6">
          {/* Ticket list */}
          <div className="rounded-xl border border-stone-200 bg-white">
            {loading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-stone-100" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-stone-500">
                {filter === 'all' ? 'No support tickets yet. Emails to support@neighbri.com will appear here.' : 'No tickets match this filter.'}
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectTicket(t)}
                    className={`w-full text-left px-5 py-4 transition hover:bg-stone-50 ${
                      selectedTicket?.id === t.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-900 truncate">{t.subject}</p>
                        <p className="mt-0.5 text-xs text-stone-500 truncate">{t.from}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[t.status]}`}>
                          {STATUS_LABELS[t.status]}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(t.receivedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {t.body && (
                      <p className="mt-1 text-xs text-stone-400 truncate">{t.body.slice(0, 120)}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ticket detail */}
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            {selectedTicket ? (
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <h3 className="text-sm font-semibold text-stone-900">{selectedTicket.subject}</h3>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[selectedTicket.status]}`}>
                    {STATUS_LABELS[selectedTicket.status]}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-stone-500 mb-4">
                  <p><strong className="text-stone-700">From:</strong> {selectedTicket.from}</p>
                  <p><strong className="text-stone-700">To:</strong> {selectedTicket.to.join(', ')}</p>
                  {selectedTicket.cc.length > 0 && (
                    <p><strong className="text-stone-700">CC:</strong> {selectedTicket.cc.join(', ')}</p>
                  )}
                  <p><strong className="text-stone-700">Received:</strong> {new Date(selectedTicket.receivedAt).toLocaleString()}</p>
                </div>

                {/* Email body */}
                <div className="rounded-xl bg-stone-50 p-4 mb-4 max-h-64 overflow-y-auto">
                  <p className="text-xs font-medium text-stone-400 mb-2">Message</p>
                  <pre className="whitespace-pre-wrap text-sm text-stone-700 font-sans leading-relaxed">
                    {selectedTicket.body || '(no body)'}
                  </pre>
                </div>

                {/* Status actions */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-stone-400 mb-2">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => (
                      <button
                        key={s}
                        disabled={saving || selectedTicket.status === s}
                        onClick={() => updateTicket(s)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-30 ${
                          selectedTicket.status === s
                            ? STATUS_STYLES[s]
                            : 'border border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Internal notes */}
                <div>
                  <p className="text-xs font-medium text-stone-400 mb-2">Internal Notes</p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes about this ticket..."
                    className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-purple-500 focus:outline-none min-h-20"
                  />
                  <button
                    onClick={() => updateTicket(undefined, notes)}
                    disabled={saving || notes === selectedTicket.notes}
                    className="mt-2 rounded-full bg-purple-700 px-4 py-1.5 text-xs font-medium text-white hover:bg-purple-800 disabled:opacity-40"
                  >
                    {saving ? 'Saving...' : 'Save notes'}
                  </button>
                </div>

                <p className="mt-4 text-[10px] text-stone-300 font-mono">{selectedTicket.id}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-sm text-stone-400">
                Select a ticket to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
