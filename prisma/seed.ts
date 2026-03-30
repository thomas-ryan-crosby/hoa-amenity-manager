import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ??
      'postgresql://user:password@localhost:5432/sanctuary_booking',
  }),
})

async function main() {
  console.log('Seeding database...')

  // Seed staff
  const pm = await prisma.staff.upsert({
    where: { email: 'pm@sanctuaryhoa.org' },
    update: {},
    create: {
      name: 'Property Manager',
      email: 'pm@sanctuaryhoa.org',
      phone: '+15551234567',
      role: 'PROPERTY_MANAGER',
    },
  })

  const janitor = await prisma.staff.upsert({
    where: { email: 'janitorial@sanctuaryhoa.org' },
    update: {},
    create: {
      name: 'Janitorial Staff',
      email: 'janitorial@sanctuaryhoa.org',
      phone: '+15559876543',
      role: 'JANITORIAL',
    },
  })

  // Seed amenities
  const amenities = [
    {
      name: 'Clubhouse / Event Room',
      description: 'Main clubhouse with full kitchen, seating for 80, and A/V equipment.',
      capacity: 80,
      rentalFee: 150,
      depositAmount: 200,
      calendarId: 'clubhouse-calendar-id',
      requiresApproval: true,
      autoApproveThreshold: null,
      approverStaffId: pm.id,
      escalationHours: 48,
      fullRefundHours: 72,
      partialRefundHours: 24,
      partialRefundPercent: 50,
      maxAdvanceBookingDays: 90,
      janitorialAssignment: 'rotation',
    },
    {
      name: 'Pool Area',
      description: 'Community pool with deck seating for 40. Lifeguard not included.',
      capacity: 40,
      rentalFee: 100,
      depositAmount: 150,
      calendarId: 'pool-calendar-id',
      requiresApproval: true,
      autoApproveThreshold: 10,
      approverStaffId: pm.id,
      escalationHours: 48,
      fullRefundHours: 72,
      partialRefundHours: 24,
      partialRefundPercent: 50,
      maxAdvanceBookingDays: 90,
      janitorialAssignment: 'rotation',
    },
    {
      name: 'Tennis / Pickleball Courts',
      description: 'Two regulation courts available for private events.',
      capacity: 20,
      rentalFee: 75,
      depositAmount: 100,
      calendarId: 'tennis-calendar-id',
      requiresApproval: false,
      autoApproveThreshold: null,
      approverStaffId: null,
      escalationHours: 48,
      fullRefundHours: 48,
      partialRefundHours: 12,
      partialRefundPercent: 50,
      maxAdvanceBookingDays: 60,
      janitorialAssignment: 'rotation',
    },
    {
      name: 'BBQ / Pavilion Area',
      description: 'Covered pavilion with 4 gas grills and seating for 50.',
      capacity: 50,
      rentalFee: 100,
      depositAmount: 150,
      calendarId: 'bbq-calendar-id',
      requiresApproval: true,
      autoApproveThreshold: 15,
      approverStaffId: pm.id,
      escalationHours: 48,
      fullRefundHours: 72,
      partialRefundHours: 24,
      partialRefundPercent: 50,
      maxAdvanceBookingDays: 90,
      janitorialAssignment: 'rotation',
    },
  ]

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { id: amenity.name.toLowerCase().replace(/[^a-z0-9]/g, '-') },
      update: {},
      create: {
        ...amenity,
        rentalFee: amenity.rentalFee,
        depositAmount: amenity.depositAmount,
      },
    })
  }

  console.log('Seeding complete.')
  console.log(`  Staff: ${pm.name}, ${janitor.name}`)
  console.log(`  Amenities: ${amenities.length} created`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
