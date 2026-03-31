export const dynamic = 'force-dynamic'

import { getAllAmenities, getAllStaff, getBlackoutDates, getSettings } from '@/lib/firebase/db'
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient'

export default async function AdminSettingsPage() {
  const [amenities, staff, settings] = await Promise.all([
    getAllAmenities(),
    getAllStaff(),
    getSettings(),
  ])

  const amenitiesWithBlackouts = await Promise.all(
    amenities
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (amenity) => {
        const blackoutDates = await getBlackoutDates(amenity.id)
        return {
          ...amenity,
          janitorialAssignment: amenity.janitorialAssignment as 'rotation' | 'manual',
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
    <AdminSettingsClient
      initialAmenities={amenitiesWithBlackouts}
      initialStaff={sortedStaff}
      initialSettings={{
        pmEmail: settings.pmEmail,
        orgName: settings.orgName,
        twilioPhoneNumber: settings.twilioPhoneNumber,
      }}
    />
  )
}
