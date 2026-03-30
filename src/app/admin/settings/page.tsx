export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db/client'
import { AdminSettingsClient } from '@/components/admin/AdminSettingsClient'

export default async function AdminSettingsPage() {
  const [amenities, staff] = await Promise.all([
    prisma.amenity.findMany({
      include: {
        blackoutDates: {
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.staff.findMany({
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    }),
  ])

  return (
    <AdminSettingsClient
      initialAmenities={amenities.map((amenity) => ({
        ...amenity,
        rentalFee: Number(amenity.rentalFee),
        depositAmount: Number(amenity.depositAmount),
        janitorialAssignment: amenity.janitorialAssignment as 'rotation' | 'manual',
        blackoutDates: amenity.blackoutDates.map((blackout) => ({
          ...blackout,
          startDate: blackout.startDate.toISOString(),
          endDate: blackout.endDate.toISOString(),
        })),
      }))}
      initialStaff={staff}
    />
  )
}
