import { NextRequest, NextResponse } from 'next/server'
import { getAllCommunities, getAllAmenities } from '@/lib/firebase/db'

/**
 * GET — list communities with externally-bookable amenities, filtered by zip.
 * Public endpoint — no auth required.
 */
export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip')?.trim()

  const allCommunities = await getAllCommunities()
  let active = allCommunities.filter((c) => c.isActive)

  if (zip) {
    active = active.filter((c) => c.zip?.startsWith(zip.slice(0, 3)))
  }

  // For each community, check if it has externally-bookable amenities
  const results = await Promise.all(
    active.map(async (c) => {
      const amenities = await getAllAmenities(c.id)
      const external = amenities.filter((a) => a.allowExternalBooking)
      if (external.length === 0) return null

      return {
        slug: c.slug,
        name: c.name,
        city: c.city,
        state: c.state,
        zip: c.zip,
        amenityCount: external.length,
        amenities: external.map((a) => a.name),
      }
    }),
  )

  return NextResponse.json({
    communities: results.filter(Boolean),
  })
}
