import { NextRequest, NextResponse } from 'next/server'
import { getAllCommunities } from '@/lib/firebase/db'

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip')?.trim()

  const all = await getAllCommunities()
  let active = all.filter((c) => c.isActive)

  if (zip) {
    active = active.filter((c) => c.zip?.startsWith(zip.slice(0, 3)))
  }

  const communities = active.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    city: c.city,
    state: c.state,
    zip: c.zip,
  }))

  return NextResponse.json({ communities })
}
