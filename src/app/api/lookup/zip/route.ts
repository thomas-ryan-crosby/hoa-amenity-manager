import { NextRequest, NextResponse } from 'next/server'

/**
 * Lookup city, state, and timezone from a US zip code.
 * Uses the free zippopotam.us API — no API key required.
 */

const STATE_TIMEZONES: Record<string, string> = {
  AL: 'America/Chicago', AK: 'America/Anchorage', AZ: 'America/Denver',
  AR: 'America/Chicago', CA: 'America/Los_Angeles', CO: 'America/Denver',
  CT: 'America/New_York', DE: 'America/New_York', FL: 'America/New_York',
  GA: 'America/New_York', HI: 'Pacific/Honolulu', ID: 'America/Denver',
  IL: 'America/Chicago', IN: 'America/New_York', IA: 'America/Chicago',
  KS: 'America/Chicago', KY: 'America/New_York', LA: 'America/Chicago',
  ME: 'America/New_York', MD: 'America/New_York', MA: 'America/New_York',
  MI: 'America/New_York', MN: 'America/Chicago', MS: 'America/Chicago',
  MO: 'America/Chicago', MT: 'America/Denver', NE: 'America/Chicago',
  NV: 'America/Los_Angeles', NH: 'America/New_York', NJ: 'America/New_York',
  NM: 'America/Denver', NY: 'America/New_York', NC: 'America/New_York',
  ND: 'America/Chicago', OH: 'America/New_York', OK: 'America/Chicago',
  OR: 'America/Los_Angeles', PA: 'America/New_York', RI: 'America/New_York',
  SC: 'America/New_York', SD: 'America/Chicago', TN: 'America/Chicago',
  TX: 'America/Chicago', UT: 'America/Denver', VT: 'America/New_York',
  VA: 'America/New_York', WA: 'America/Los_Angeles', WV: 'America/New_York',
  WI: 'America/Chicago', WY: 'America/Denver', DC: 'America/New_York',
}

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip')?.trim()
  if (!zip || zip.length < 5) {
    return NextResponse.json({ error: 'Valid 5-digit zip required' }, { status: 400 })
  }

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      next: { revalidate: 86400 }, // cache for 24 hours
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Zip code not found' }, { status: 404 })
    }

    const data = await res.json()
    const place = data.places?.[0]

    if (!place) {
      return NextResponse.json({ error: 'Zip code not found' }, { status: 404 })
    }

    const stateAbbr = place['state abbreviation'] as string
    const timezone = STATE_TIMEZONES[stateAbbr] ?? 'America/Chicago'

    return NextResponse.json({
      city: place['place name'] as string,
      state: stateAbbr,
      timezone,
    })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
