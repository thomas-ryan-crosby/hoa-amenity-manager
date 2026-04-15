import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { requireRole } from '@/lib/auth'
import { getActiveCommunityId } from '@/lib/community'
import {
  getCommunityById,
  getLedgerEntriesForCommunity,
  type LedgerEntry,
} from '@/lib/firebase/db'

// ---------------------------------------------------------------------------
// GET — community-wide .xlsx export of ledger entries
//
// Produces three sheets: Transactions, Monthly Summary, Resident Summary.
// Optional query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ---------------------------------------------------------------------------

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

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF064E3B' }, // emerald-900
}

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
}

const TOTAL_ROW_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF5F5F4' }, // stone-100
}

function styleHeaderRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL
    cell.font = HEADER_FONT
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF1C1917' } },
    }
  })
  row.height = 22
}

function styleTotalRow(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = TOTAL_ROW_FILL
    cell.font = { bold: true, color: { argb: 'FF1C1917' } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD6D3D1' } },
    }
  })
}

type TransactionRow = {
  month: string
  date: Date
  resident: string
  email: string
  amenity: string
  chargeType: string
  amount: number
  bookingId: string
  memo: string
}

type MonthSummary = {
  month: string
  transactions: number
  rental: number
  deposit: number
  total: number
}

type ResidentSummary = {
  month: string
  resident: string
  email: string
  transactions: number
  rental: number
  deposit: number
  total: number
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

    // Build flat transaction list + aggregates
    const transactions: TransactionRow[] = entries.map((e) => ({
      month: monthLabel(monthKey(e.bookingStart)),
      date: e.bookingStart,
      resident: e.residentName,
      email: e.residentEmail,
      amenity: e.amenityName,
      chargeType: e.type === 'rental' ? 'Rental fee' : 'Refundable deposit',
      amount: e.amount,
      bookingId: e.bookingId,
      memo: e.memo,
    }))

    const byMonth = new Map<string, LedgerEntry[]>()
    for (const e of entries) {
      const key = monthKey(e.bookingStart)
      if (!byMonth.has(key)) byMonth.set(key, [])
      byMonth.get(key)!.push(e)
    }

    const monthSummaries: MonthSummary[] = [...byMonth.keys()]
      .sort()
      .map((key) => {
        const rows = byMonth.get(key)!
        const rental = rows.filter((e) => e.type === 'rental').reduce((s, e) => s + e.amount, 0)
        const deposit = rows.filter((e) => e.type === 'deposit').reduce((s, e) => s + e.amount, 0)
        return {
          month: monthLabel(key),
          transactions: rows.length,
          rental,
          deposit,
          total: rental + deposit,
        }
      })

    // Per-resident per-month rollup
    const residentMap = new Map<string, ResidentSummary>()
    for (const e of entries) {
      const key = `${monthKey(e.bookingStart)}|${e.residentId}`
      const existing = residentMap.get(key) ?? {
        month: monthLabel(monthKey(e.bookingStart)),
        resident: e.residentName,
        email: e.residentEmail,
        transactions: 0,
        rental: 0,
        deposit: 0,
        total: 0,
      }
      existing.transactions += 1
      if (e.type === 'rental') existing.rental += e.amount
      if (e.type === 'deposit') existing.deposit += e.amount
      existing.total = existing.rental + existing.deposit
      residentMap.set(key, existing)
    }
    const residentSummaries = [...residentMap.values()].sort((a, b) => {
      if (a.month !== b.month) return a.month.localeCompare(b.month)
      return a.resident.localeCompare(b.resident)
    })

    const grandRental = entries.filter((e) => e.type === 'rental').reduce((s, e) => s + e.amount, 0)
    const grandDeposit = entries.filter((e) => e.type === 'deposit').reduce((s, e) => s + e.amount, 0)
    const grandTotal = grandRental + grandDeposit

    // -----------------------------------------------------------------------
    // Build workbook
    // -----------------------------------------------------------------------
    const wb = new ExcelJS.Workbook()
    wb.creator = 'Neighbri'
    wb.created = new Date()

    const currencyFmt = '"$"#,##0.00'
    const dateFmt = 'yyyy-mm-dd'

    // --- Overview sheet -----------------------------------------------------
    const overview = wb.addWorksheet('Overview', { views: [{ state: 'frozen', ySplit: 1 }] })
    overview.columns = [
      { header: '', key: 'label', width: 22 },
      { header: '', key: 'value', width: 50 },
    ]
    overview.getCell('A1').value = 'Neighbri Ledger Export'
    overview.getCell('A1').font = { bold: true, size: 16, color: { argb: 'FF064E3B' } }
    overview.mergeCells('A1:B1')
    overview.getRow(1).height = 28

    const facts: [string, string | number | Date][] = [
      ['Community', community.name],
      ['Generated', new Date()],
    ]
    if (from || to) facts.push(['Range', `${from ? formatDate(from) : 'start'} → ${to ? formatDate(to) : 'now'}`])
    facts.push(
      ['Total entries', entries.length],
      ['Rental total', grandRental],
      ['Deposit total', grandDeposit],
      ['Grand total', grandTotal],
    )

    facts.forEach(([label, value], idx) => {
      const r = overview.addRow({ label, value })
      r.getCell('label').font = { bold: true, color: { argb: 'FF57534E' } }
      if (label === 'Generated' && value instanceof Date) {
        r.getCell('value').numFmt = 'yyyy-mm-dd hh:mm'
      }
      if (label === 'Rental total' || label === 'Deposit total' || label === 'Grand total') {
        r.getCell('value').numFmt = currencyFmt
      }
      if (label === 'Grand total') {
        r.getCell('label').font = { bold: true, size: 12, color: { argb: 'FF064E3B' } }
        r.getCell('value').font = { bold: true, size: 12, color: { argb: 'FF064E3B' } }
      }
      // Silence "used" warning for the `idx` loop var
      void idx
    })

    // --- Transactions sheet -------------------------------------------------
    const tx = wb.addWorksheet('Transactions', { views: [{ state: 'frozen', ySplit: 1 }] })
    tx.columns = [
      { header: 'Month', key: 'month', width: 16 },
      { header: 'Booking date', key: 'date', width: 14, style: { numFmt: dateFmt } },
      { header: 'Resident', key: 'resident', width: 22 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Amenity', key: 'amenity', width: 24 },
      { header: 'Charge type', key: 'chargeType', width: 18 },
      { header: 'Amount', key: 'amount', width: 12, style: { numFmt: currencyFmt } },
      { header: 'Booking ID', key: 'bookingId', width: 20 },
      { header: 'Memo', key: 'memo', width: 40 },
    ]
    styleHeaderRow(tx.getRow(1))
    transactions.forEach((t) => tx.addRow(t))
    tx.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: tx.columns.length } }

    // --- Monthly summary sheet ---------------------------------------------
    const monthly = wb.addWorksheet('Monthly Summary', { views: [{ state: 'frozen', ySplit: 1 }] })
    monthly.columns = [
      { header: 'Month', key: 'month', width: 18 },
      { header: 'Transactions', key: 'transactions', width: 14 },
      { header: 'Rental total', key: 'rental', width: 14, style: { numFmt: currencyFmt } },
      { header: 'Deposit total', key: 'deposit', width: 14, style: { numFmt: currencyFmt } },
      { header: 'Total', key: 'total', width: 14, style: { numFmt: currencyFmt } },
    ]
    styleHeaderRow(monthly.getRow(1))
    monthSummaries.forEach((m) => monthly.addRow(m))
    const monthlyTotalRow = monthly.addRow({
      month: 'All months',
      transactions: entries.length,
      rental: grandRental,
      deposit: grandDeposit,
      total: grandTotal,
    })
    styleTotalRow(monthlyTotalRow)

    // --- Resident summary sheet --------------------------------------------
    const residents = wb.addWorksheet('Resident Summary', { views: [{ state: 'frozen', ySplit: 1 }] })
    residents.columns = [
      { header: 'Month', key: 'month', width: 18 },
      { header: 'Resident', key: 'resident', width: 22 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Transactions', key: 'transactions', width: 14 },
      { header: 'Rental total', key: 'rental', width: 14, style: { numFmt: currencyFmt } },
      { header: 'Deposit total', key: 'deposit', width: 14, style: { numFmt: currencyFmt } },
      { header: 'Total', key: 'total', width: 14, style: { numFmt: currencyFmt } },
    ]
    styleHeaderRow(residents.getRow(1))
    residentSummaries.forEach((r) => residents.addRow(r))
    residents.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: residents.columns.length } }

    const buffer = await wb.xlsx.writeBuffer()
    const today = formatDate(new Date())
    const safeCommunity = community.slug || community.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
    const filename = `ledger-${safeCommunity}-${today}.xlsx`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
