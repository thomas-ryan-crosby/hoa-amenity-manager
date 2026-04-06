export const dynamic = 'force-dynamic'

import { getAllAmenities, getAllStaff, getBlackoutDates, getAllAreas } from '@/lib/firebase/db'
import { AmenitySetupClient } from '@/components/admin/AmenitySetupClient'
import { getActiveCommunityId } from '@/lib/community'

export default async function AmenitySetupPage() {
  const communityId = await getActiveCommunityId()
  const [amenities, staff, areas] = await Promise.all([
    getAllAmenities(communityId ?? undefined),
    getAllStaff(communityId ?? undefined),
    getAllAreas(communityId ?? undefined),
  ])

  const amenitiesWithBlackouts = await Promise.all(
    amenities
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map(async (amenity) => {
        const blackoutDates = await getBlackoutDates(amenity.id)
        return {
          ...amenity,
          janitorialAssignment: amenity.janitorialAssignment as 'rotation' | 'manual' | 'none',
          blackoutDates: blackoutDates
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
            .map((blackout) => ({
              ...blackout,
              startDate: blackout.startDate.toISOString(),
              endDate: blackout.endDate.toISOString(),
            })),
        }
      }),
  )

  const sortedStaff = staff.sort((a, b) => {
    const roleCmp = a.role.localeCompare(b.role)
    return roleCmp !== 0 ? roleCmp : a.name.localeCompare(b.name)
  })

  return (
    <AmenitySetupClient
      initialAmenities={amenitiesWithBlackouts}
      initialStaff={sortedStaff}
      initialAreas={areas}
    />
  )
}
