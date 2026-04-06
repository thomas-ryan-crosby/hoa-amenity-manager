import { NextResponse } from 'next/server'
import { getAllCommunities } from '@/lib/firebase/db'

export async function GET() {
  const all = await getAllCommunities()
  const active = all
    .filter((c) => c.isActive)
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      city: c.city,
      state: c.state,
    }))

  return NextResponse.json({ communities: active })
}
