import { NextResponse } from 'next/server'
import { getAllAmenities, getAllAreas, getBlackoutDates } from '@/lib/firebase/db'
import { getActiveCommunityId } from '@/lib/community'

export async function GET() {
  const communityId = await getActiveCommunityId()

  const [amenities, areas] = await Promise.all([
    getAllAmenities(communityId ?? undefined),
    getAllAreas(communityId ?? undefined),
  ])

  const sortedAmenities = await Promise.all(
    amenities
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(async (a) => {
        const blackouts = await getBlackoutDates(a.id)
        return {
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
          blackoutDates: blackouts.map((b) => ({
            start: b.startDate.toISOString(),
            end: b.endDate.toISOString(),
            recurring: b.recurring,
          })),
        }
      }),
  )

  return NextResponse.json({
    amenities: sortedAmenities,
    areas,
  })
}
