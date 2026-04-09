import { NextResponse } from 'next/server'
import { getAllAmenities, getAllAreas } from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

export async function GET() {
  const communityId = await getActiveCommunityId()

  const [amenities, areas] = await Promise.all([
    getAllAmenities(communityId ?? undefined),
    getAllAreas(communityId ?? undefined),
  ])

  const sortedAmenities = amenities
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      capacity: a.capacity,
      rentalFee: Number(a.rentalFee),
      depositAmount: Number(a.depositAmount),
      maxAdvanceBookingDays: a.maxAdvanceBookingDays,
      suggestedAmenityIds: a.suggestedAmenityIds ?? [],
      areaId: a.areaId ?? null,
      sortOrder: a.sortOrder ?? 0,
      hasRules: a.hasRules ?? false,
      rules: a.rules ?? null,
      isDefault: a.isDefault ?? false,
      defaultTurnTimeHours: a.defaultTurnTimeHours ?? 0,
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  return NextResponse.json({
    amenities: sortedAmenities,
    areas,
  })
}
