'use client'

import { useState } from 'react'
import Link from 'next/link'

type Contact = {
  company: string
  keyPerson: string
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
  { company: 'GNO Property Management', keyPerson: 'Johnson Clawson (Owner)', location: 'New Orleans (826 Union St, Ste 200)', phone: '(504) 528-7028', email: 'customerservice@gnoproperty.com', website: 'gnoproperty.com', tier: 'PM Company', communities: '40+ in St. Tammany alone', status: 'not_started' },
  { company: 'Gulf South Property Management', keyPerson: 'Bobby Smith (President)', location: 'Madisonville (381 Hwy 21, Ste 204)', phone: '(985) 200-0660', email: 'info@gspmla.com', website: 'gspmla.com', tier: 'PM Company', communities: '30+', status: 'not_started' },
  { company: 'Magnolia Management Services', keyPerson: 'Daniel Camp (Owner)', location: 'Baton Rouge + Mandeville', phone: '(225) 286-7546', email: 'info@magnoliabr.com', website: 'magnoliabr.org', tier: 'PM Company', communities: '130+', status: 'not_started' },
  { company: 'Renaissance Property Management', keyPerson: 'Rodney Durst (Owner)', location: 'Covington (506 E. Rutland St)', phone: '(985) 624-2900', email: 'info@renmgt.com', website: 'renmgt.com', tier: 'PM Company', communities: '15-20', status: 'not_started' },
  { company: 'Restoration Property Management', keyPerson: 'Chad & Joy Harvel (Owners)', location: 'Covington', phone: '(985) 350-0222', email: 'contact@restorationpm.com', website: 'restorationpm.com', tier: 'PM Company', communities: '10-15', status: 'not_started' },
  { company: 'CMGT (Community Management)', keyPerson: '', location: 'Denham Springs (140 Aspen Sq, Ste H)', phone: '(225) 503-2648', email: 'info@cmgt.org', website: 'cmgt.org', tier: 'PM Company', communities: '380+ (multi-state)', status: 'not_started' },
  { company: 'Legacies Management', keyPerson: 'Ashley Alford (CEO), Kellie Alford (Co-Founder)', location: 'Denham Springs', phone: '(225) 791-1644', email: 'info@legaciesmanagement.com', website: 'legaciesmanagement.com', tier: 'PM Company', communities: 'LA/MS/AL', status: 'not_started' },
  { company: 'Patton Property Management', keyPerson: 'George Patton Waters Jr. (Owner)', location: 'Baton Rouge (8054 Summa Ave, Ste E)', phone: '(225) 769-5002', email: 'pattonprop@gmail.com', website: 'pattonmanagement.com', tier: 'PM Company', communities: '12+', status: 'not_started' },
  { company: 'Goodwin & Company (LA)', keyPerson: '', location: 'Jennings, LA (National firm)', phone: '(337) 617-3951', email: '', website: 'goodwin-co.com', tier: 'PM Company', communities: 'National (TX/LA/CO)', status: 'not_started' },
  { company: 'Latter & Blum PM', keyPerson: 'Mitchell Schoolmeyer (Service Coord.)', location: 'New Orleans (7840 Maple St)', phone: '(504) 866-7000', email: '', website: 'latter-blum.com/property-management', tier: 'PM Company', communities: '50+ mixed', status: 'not_started' },
  { company: 'Pelican Management Group', keyPerson: '', location: 'Louisiana', phone: '(225) 286-7546', email: 'info@pelicanmanagement.org', website: '', tier: 'PM Company', communities: '5-10', status: 'not_started' },

  // Tier 2: Luxury Communities (Northshore)
  { company: 'Beau Chene HOA', keyPerson: 'Bill Maier', location: 'Mandeville (105 Beau Chene Blvd)', phone: '(985) 231-6285', email: '', website: 'bchoa.org', tier: 'Luxury Community', communities: 'Large gated — golf, pool, tennis', status: 'not_started' },
  { company: 'Beau Rivage HOA', keyPerson: 'Arlene Rome', location: 'Mandeville', phone: '(985) 727-1983', email: 'arlenerome@att.net', website: 'beaurivagemandeville.com', tier: 'Luxury Community', communities: 'Pool, clubhouse', status: 'not_started' },
  { company: 'Fontainebleau POA', keyPerson: 'via GNO PM', location: 'Mandeville', phone: '(504) 528-7028', email: 'info@gnoproperty.com', website: 'fpoaonline.com', tier: 'Luxury Community', communities: 'Large — pool, clubhouse', status: 'not_started' },
  { company: 'Eden Isles', keyPerson: 'Mike Small', location: 'Slidell', phone: '(504) 905-0702', email: '', website: '', tier: 'Luxury Community', communities: 'Waterfront community', status: 'not_started' },
  { company: 'The Lakes HOA', keyPerson: 'Robert Head', location: 'Mandeville', phone: '(504) 231-7707', email: '', website: 'lakeshoa.com', tier: 'Luxury Community', communities: 'Pool, clubhouse', status: 'not_started' },
  { company: 'Chamale Property Owners', keyPerson: 'Mike Rich', location: 'Mandeville', phone: '(985) 290-9806', email: 'mikerich@mypontchartrain.com', website: '', tier: 'Luxury Community', communities: 'Large established', status: 'not_started' },
  { company: 'Audubon Trail', keyPerson: 'via Gulf South PM', location: 'Northshore', phone: '(985) 200-0660', email: 'info@gspmla.com', website: '', tier: 'Luxury Community', communities: 'Pool, amenity center', status: 'not_started' },
  { company: 'Grand Oaks HOA', keyPerson: 'via Renaissance PM', location: 'Northshore', phone: '(985) 624-2900', email: 'info@renmgt.com', website: 'grandoakshoa.org', tier: 'Luxury Community', communities: 'Pool, clubhouse', status: 'not_started' },

  // Tier 2: Baton Rouge Communities
  { company: 'DSLD Homes (HOA Dept)', keyPerson: 'Customer Care', location: 'Baton Rouge (7660 Pecue Ln)', phone: '1-844-848-0071', email: '', website: 'dsldhomes.com', tier: 'Builder', communities: '20-30 new HOAs/year', status: 'not_started' },

  // Tier 3: Industry / Networking
  { company: 'CAI Louisiana Chapter', keyPerson: '', location: 'Baton Rouge', phone: '(225) 751-4110', email: 'CAILouisiana@gmail.com', website: 'caionline.org/find-a-chapter', tier: 'Industry', communities: '~100 members', status: 'not_started' },
  { company: 'Association of Associations', keyPerson: 'Rick Wilke', location: 'St. Tammany Parish', phone: '(985) 875-9066', email: 'rick@thewilkes.us', website: '', tier: 'Industry', communities: 'HOA referral network', status: 'not_started' },
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

  const tiers = ['all', 'PM Company', 'Luxury Community', 'Builder', 'Industry']
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
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="https://github.com/thomas-ryan-crosby/hoa-amenity-manager/blob/main/LAUNCH_CAMPAIGN.md" target="_blank" rel="noopener noreferrer" className="rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200">
              View Full Campaign Strategy
            </a>
            <a href="https://github.com/thomas-ryan-crosby/hoa-amenity-manager/blob/main/CONTACT_LIST.md" target="_blank" rel="noopener noreferrer" className="rounded-full bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200">
              View Detailed Contact List
            </a>
          </div>
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
                <th className="px-3 py-3 font-medium">Key Person</th>
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
                  <td className="px-3 py-3 text-sm font-medium text-stone-700">{c.keyPerson || <span className="text-stone-300">—</span>}</td>
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
