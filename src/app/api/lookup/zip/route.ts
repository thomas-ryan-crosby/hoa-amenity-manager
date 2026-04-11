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

// Zip prefix overrides for states that span multiple timezones
// Florida panhandle (32xxx): some are Central
const ZIP_TZ_OVERRIDES: [string, string][] = [
  // Florida panhandle — Central time
  ['322', 'America/Chicago'], // Tallahassee area
  ['323', 'America/Chicago'], // Tallahassee
  ['324', 'America/Chicago'], // Panama City
  ['325', 'America/Chicago'], // Pensacola
  // Indiana — some counties are Central
  ['476', 'America/Chicago'], // Evansville IN
  ['477', 'America/Chicago'], // Evansville IN
  ['478', 'America/Chicago'], // Terre Haute IN
  ['479', 'America/Chicago'], // Lafayette IN (some)
  // Kentucky — western KY is Central
  ['420', 'America/Chicago'], // Paducah
  ['421', 'America/Chicago'], // Bowling Green
  ['422', 'America/Chicago'], // Owensboro area
  // Michigan — some UP counties are Central
  ['498', 'America/Chicago'], // Iron Mountain MI
  ['499', 'America/Chicago'], // Iron Mountain MI
  // Nebraska — western NE is Mountain
  ['691', 'America/Denver'], // North Platte
  ['693', 'America/Denver'], // Alliance
  // North Dakota — western ND is Mountain
  ['586', 'America/Denver'], // Dickinson
  ['587', 'America/Denver'], // Minot area (some)
  ['588', 'America/Denver'], // Williston
  // Oregon — eastern OR is Mountain
  ['978', 'America/Denver'], // Pendleton
  ['979', 'America/Denver'], // Boise fringe
  // South Dakota — western SD is Mountain
  ['575', 'America/Denver'], // Rapid City
  ['576', 'America/Denver'], // Mobridge (some)
  ['577', 'America/Denver'], // Rapid City area
  // Tennessee — eastern TN is Eastern
  ['376', 'America/New_York'], // Johnson City
  ['377', 'America/New_York'], // Knoxville
  ['378', 'America/New_York'], // Knoxville
  ['379', 'America/New_York'], // Knoxville area
  // Texas — El Paso is Mountain
  ['798', 'America/Denver'], // El Paso
  ['799', 'America/Denver'], // El Paso
  // Idaho — north ID panhandle is Pacific (rare)
  ['838', 'America/Los_Angeles'], // Lewiston fringe
]

function getTimezoneForZip(zip: string, stateAbbr: string): string {
  // Check zip prefix overrides first (more specific)
  for (const [prefix, tz] of ZIP_TZ_OVERRIDES) {
    if (zip.startsWith(prefix)) return tz
  }
  // Fall back to state default
  return STATE_TIMEZONES[stateAbbr] ?? 'America/Chicago'
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
    const timezone = getTimezoneForZip(zip, stateAbbr)

    return NextResponse.json({
      city: place['place name'] as string,
      state: stateAbbr,
      timezone,
    })
  } catch {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
