'use client'

import { useState } from 'react'
import Link from 'next/link'

type Contact = {
  company: string
  location: string
  phone: string
  email: string
  website: string
  tier: string
  communities: string
  status: 'not_started' | 'contacted' | 'demo_booked' | 'trial' | 'converted' | 'declined'
}

const CONTACTS: Contact[] = [
  // Tier 1: PM Companies (Whales)
  { company: 'GNO Property Management', location: 'New Orleans', phone: '(504) 528-7028', email: 'customerservice@gnoproperty.com', website: 'gnoproperty.com', tier: 'PM Company', communities: '40+ in St. Tammany alone', status: 'not_started' },
  { company: 'Gulf South Property Management', location: 'Madisonville', phone: '(985) 200-0660', email: 'info@gspmla.com', website: 'gspmla.com', tier: 'PM Company', communities: '30+', status: 'not_started' },
  { company: 'Magnolia Management Services', location: 'Baton Rouge + Mandeville', phone: '(225) 286-7546', email: 'info@magnoliabr.com', website: 'magnoliabr.org', tier: 'PM Company', communities: '130+', status: 'not_started' },
  { company: 'Renaissance Property Management', location: 'Covington', phone: '(985) 624-2900', email: 'info@renmgt.com', website: 'renmgt.com', tier: 'PM Company', communities: '15-20', status: 'not_started' },
  { company: 'Restoration Property Management', location: 'Covington', phone: '(985) 350-0222', email: 'contact@restorationpm.com', website: 'restorationpm.com', tier: 'PM Company', communities: '10-15', status: 'not_started' },
  { company: 'Goodwin & Company (LA)', location: 'Jennings, LA', phone: '(337) 617-3951', email: '', website: 'goodwin-co.com', tier: 'PM Company', communities: 'National', status: 'not_started' },
  { company: 'CMGT (Community Management)', location: 'Slidell + Statewide', phone: '', email: '', website: 'cmgt.org', tier: 'PM Company', communities: 'Multi-state', status: 'not_started' },
  { company: 'Pelican Management Group', location: 'Louisiana', phone: '(225) 286-7546', email: 'info@pelicanmanagement.org', website: '', tier: 'PM Company', communities: '5-10', status: 'not_started' },
  { company: 'Latter & Blum PM', location: 'New Orleans', phone: '', email: '', website: 'lattermanagement.com', tier: 'PM Company', communities: '50+ mixed', status: 'not_started' },

  // Tier 2: Luxury Communities
  { company: 'Beau Chene HOA', location: 'Mandeville', phone: '(985) 231-6285', email: '', website: 'bchoa.org', tier: 'Luxury Community', communities: '1 (large gated)', status: 'not_started' },
  { company: 'Beau Rivage HOA', location: 'Mandeville', phone: '(985) 727-1983', email: 'arlenerome@att.net', website: 'beaurivagemandeville.com', tier: 'Luxury Community', communities: '1', status: 'not_started' },
  { company: 'Fontainebleau (via GNO PM)', location: 'Mandeville', phone: '(504) 528-7028', email: 'info@gnoproperty.com', website: 'fpoaonline.com', tier: 'Luxury Community', communities: '1 (large)', status: 'not_started' },
  { company: 'Eden Isles', location: 'Slidell', phone: '(504) 905-0702', email: '', website: '', tier: 'Luxury Community', communities: '1', status: 'not_started' },
  { company: 'The Lakes HOA', location: 'Mandeville', phone: '(504) 231-7707', email: '', website: 'lakeshoa.com', tier: 'Luxury Community', communities: '1', status: 'not_started' },
  { company: 'Chamale Property Owners', location: 'Mandeville', phone: '(985) 290-9806', email: 'mikerich@mypontchartrain.com', website: '', tier: 'Luxury Community', communities: '1', status: 'not_started' },

  // Tier 3: Industry
  { company: 'CAI Louisiana Chapter', location: 'Baton Rouge', phone: '(225) 751-4110', email: 'CAILouisiana@gmail.com', website: 'caionline.org', tier: 'Industry', communities: '~100 members', status: 'not_started' },
  { company: 'Association of Associations', location: 'St. Tammany', phone: '(985) 875-9066', email: 'rick@thewilkes.us', website: '', tier: 'Industry', communities: 'Referral network', status: 'not_started' },
]

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  contacted: 'Contacted',
  demo_booked: 'Demo Booked',
  trial: 'Trial',
  converted: 'Converted',
  declined: 'Declined',
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-stone-100 text-stone-600',
  contacted: 'bg-blue-50 text-blue-700',
  demo_booked: 'bg-purple-50 text-purple-700',
  trial: 'bg-amber-50 text-amber-700',
  converted: 'bg-emerald-50 text-emerald-700',
  declined: 'bg-red-50 text-red-700',
}

export default function LaunchPage() {
  const [filter, setFilter] = useState<string>('all')
  const [statuses, setStatuses] = useState<Record<string, string>>({})

  function getStatus(company: string): string {
    return statuses[company] ?? 'not_started'
  }

  function setStatus(company: string, status: string) {
    setStatuses((prev) => ({ ...prev, [company]: status }))
  }

  const tiers = ['all', 'PM Company', 'Luxury Community', 'Industry']
  const filtered = filter === 'all' ? CONTACTS : CONTACTS.filter((c) => c.tier === filter)

  const stats = {
    total: CONTACTS.length,
    contacted: CONTACTS.filter((c) => getStatus(c.company) === 'contacted').length,
    demos: CONTACTS.filter((c) => getStatus(c.company) === 'demo_booked').length,
    trials: CONTACTS.filter((c) => getStatus(c.company) === 'trial').length,
    converted: CONTACTS.filter((c) => getStatus(c.company) === 'converted').length,
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="border-b border-purple-200 bg-purple-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-purple-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">Internal</span>
            <h1 className="text-lg font-semibold text-stone-900">Platform Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="mb-6">
          <Link href="/internal" className="text-sm text-purple-700 hover:text-purple-900">&larr; Back to dashboard</Link>
          <h2 className="mt-2 text-xl font-bold text-stone-900">Louisiana Launch — Contact Pipeline</h2>
          <p className="mt-1 text-sm text-stone-500">
            Target list for the Louisiana market launch. Social proof: The Sanctuary, Mandeville.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-stone-900">{stats.total}</p>
            <p className="text-xs text-stone-500">Total Leads</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.contacted}</p>
            <p className="text-xs text-stone-500">Contacted</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.demos}</p>
            <p className="text-xs text-stone-500">Demos</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.trials}</p>
            <p className="text-xs text-stone-500">Trials</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.converted}</p>
            <p className="text-xs text-stone-500">Converted</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mb-4 flex flex-wrap gap-2">
          {tiers.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                filter === t ? 'bg-purple-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>

        {/* Contact list */}
        <div className="rounded-xl border border-stone-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-stone-400 uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-3 py-3 font-medium">Location</th>
                <th className="px-3 py-3 font-medium">Tier</th>
                <th className="px-3 py-3 font-medium">Communities</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.map((c) => (
                <tr key={c.company} className="hover:bg-stone-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{c.company}</p>
                    {c.website && <p className="text-xs text-emerald-600">{c.website}</p>}
                  </td>
                  <td className="px-3 py-3 text-stone-600">{c.location}</td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">{c.tier}</span>
                  </td>
                  <td className="px-3 py-3 text-stone-600">{c.communities}</td>
                  <td className="px-3 py-3">
                    {c.phone && <p className="text-xs text-stone-600">{c.phone}</p>}
                    {c.email && <p className="text-xs text-emerald-600 break-all">{c.email}</p>}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={getStatus(c.company)}
                      onChange={(e) => setStatus(c.company, e.target.value)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border-0 ${STATUS_COLORS[getStatus(c.company)]}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-stone-400">
          Note: Status changes are local to this session. For persistent CRM tracking, consider Instantly.ai or HubSpot.
        </p>
      </div>
    </div>
  )
}
