import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { getAllResidents } from '@/lib/firebase/db'

export async function GET() {
  const authState = await requireRole(['property_manager'])
  if (!authState.ok) return authState.response

  const residents = await getAllResidents()

  return NextResponse.json({
    residents: residents
      .sort((a, b) => {
        // Pending first, then by createdAt desc
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (b.status === 'pending' && a.status !== 'pending') return 1
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
      .map((r) => ({
        ...r,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      })),
  })
}
