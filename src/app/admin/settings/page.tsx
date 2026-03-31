export const dynamic = 'force-dynamic'

import { getAllStaff, getSettings } from '@/lib/firebase/db'
import { GeneralSettingsClient } from '@/components/admin/GeneralSettingsClient'

export default async function GeneralSettingsPage() {
  const [staff, settings] = await Promise.all([
    getAllStaff(),
    getSettings(),
  ])

  const sortedStaff = staff.sort((a, b) => {
    const roleCmp = a.role.localeCompare(b.role)
    return roleCmp !== 0 ? roleCmp : a.name.localeCompare(b.name)
  })

  return (
    <GeneralSettingsClient
      initialStaff={sortedStaff}
      initialSettings={{
        pmEmail: settings.pmEmail,
        orgName: settings.orgName,
        twilioPhoneNumber: settings.twilioPhoneNumber,
      }}
    />
  )
}
