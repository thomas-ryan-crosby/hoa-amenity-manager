import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import {
  getCommunityById,
  getLedgerEntriesForCommunity,
  type LedgerEntry,
} from '@/lib/firebase/db'

// ---------------------------------------------------------------------------
// GET — community-wide CSV export of ledger entries
//
// Response: text/csv grouped by month, with per-resident subtotals.
// Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ---------------------------------------------------------------------------

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  // Quote if it contains comma, newline, or quote
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatCurrency(amount: number): string {
  return amount.toFixed(2)
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(['property_manager'])
    if (!auth.ok) return auth.response

    if (auth.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const communityId = await getActiveCommunityId()
    if (!communityId) {
      return NextResponse.json({ error: 'No active community' }, { status: 400 })
    }

    const community = await getCommunityById(communityId)
    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    const url = new URL(req.url)
    const fromStr = url.searchParams.get('from')
    const toStr = url.searchParams.get('to')
    const from = fromStr ? new Date(fromStr) : undefined
    const to = toStr ? new Date(toStr) : undefined

    const entries = await getLedgerEntriesForCommunity(communityId, { from, to })

  // Group entries by YYYY-MM, ordered ascending
  const grouped = new Map<string, LedgerEntry[]>()
  for (const entry of entries) {
    const key = monthKey(entry.bookingStart)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(entry)
  }

  const lines: string[] = []
  lines.push(`Neighbri Ledger Export — ${community.name}`)
  lines.push(`Generated: ${new Date().toISOString()}`)
  if (from || to) {
    lines.push(`Range: ${from ? formatDate(from) : 'start'} to ${to ? formatDate(to) : 'now'}`)
  }
  lines.push(`Total entries: ${entries.length}`)
  lines.push('')

  if (entries.length === 0) {
    lines.push('No ledger entries found for this range.')
  } else {
    const sortedMonths = [...grouped.keys()].sort()
    let grandTotal = 0

    for (const key of sortedMonths) {
      const monthEntries = grouped.get(key)!
      const monthTotal = monthEntries.reduce((sum, e) => sum + e.amount, 0)
      grandTotal += monthTotal

      lines.push(`## ${monthLabel(key)}`)
      lines.push('Date,Resident,Email,Amenity,Type,Amount,Booking ID,Memo')
      for (const e of monthEntries) {
        lines.push([
          formatDate(e.bookingStart),
          escapeCsv(e.residentName),
          escapeCsv(e.residentEmail),
          escapeCsv(e.amenityName),
          e.type,
          formatCurrency(e.amount),
          e.bookingId,
          escapeCsv(e.memo),
        ].join(','))
      }

      // Per-resident summary for the month
      const byResident = new Map<string, { name: string; email: string; rental: number; deposit: number; count: number }>()
      for (const e of monthEntries) {
        const bucket = byResident.get(e.residentId) ?? { name: e.residentName, email: e.residentEmail, rental: 0, deposit: 0, count: 0 }
        if (e.type === 'rental') bucket.rental += e.amount
        if (e.type === 'deposit') bucket.deposit += e.amount
        bucket.count += 1
        byResident.set(e.residentId, bucket)
      }

      lines.push('')
      lines.push(`### Summary — ${monthLabel(key)}`)
      lines.push('Resident,Email,Entries,Rental total,Deposit total,Total')
      for (const bucket of byResident.values()) {
        const total = bucket.rental + bucket.deposit
        lines.push([
          escapeCsv(bucket.name),
          escapeCsv(bucket.email),
          bucket.count,
          formatCurrency(bucket.rental),
          formatCurrency(bucket.deposit),
          formatCurrency(total),
        ].join(','))
      }
      lines.push(`,,,Month total:,,${formatCurrency(monthTotal)}`)
      lines.push('')
    }

    lines.push(`Grand total:,,,,,${formatCurrency(grandTotal)}`)
  }

  const csv = lines.join('\r\n') + '\r\n'
  const today = formatDate(new Date())
  const safeCommunity = community.slug || community.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
  const filename = `ledger-${safeCommunity}-${today}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'x-filename': filename,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[Ledger export] Failed:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to export ledger.' },
      { status: 500 },
    )
  }
}
