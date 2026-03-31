import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin directly (standalone script)
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccount) {
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
  } else {
    initializeApp()
  }
}

const db = getFirestore()

async function main() {
  console.log('Seeding Firestore...')

  // ---- Staff ----
  const pmRef = db.collection('staff').doc()
  const janitorRef = db.collection('staff').doc()

  await pmRef.set({
    name: 'Property Manager',
    email: 'pm@sanctuaryhoa.org',
    phone: '+15551234567',
    role: 'PROPERTY_MANAGER',
  })

  await janitorRef.set({
    name: 'Janitorial Staff',
    email: 'janitorial@sanctuaryhoa.org',
    phone: '+15559876543',
    role: 'JANITORIAL',
  })

  console.log(`  Staff: Property Manager (${pmRef.id}), Janitorial Staff (${janitorRef.id})`)

  // ---- Amenities ----
  const amenities = [
    {
      name: 'Clubhouse / Event Room',
      description: 'Main clubhouse with full kitchen, seating for 80, and A/V equipment.',
      capacity: 80,
      rentalFee: 150,
      depositAmount: 200,

      requiresApproval: true,
      autoApproveThreshold: null,
      approverStaffId: pmRef.id,
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

      requiresApproval: true,
      autoApproveThreshold: 10,
      approverStaffId: pmRef.id,
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

      requiresApproval: true,
      autoApproveThreshold: 15,
      approverStaffId: pmRef.id,
      escalationHours: 48,
      fullRefundHours: 72,
      partialRefundHours: 24,
      partialRefundPercent: 50,
      maxAdvanceBookingDays: 90,
      janitorialAssignment: 'rotation',
    },
  ]

  for (const amenity of amenities) {
    const ref = db.collection('amenities').doc()
    await ref.set(amenity)
    console.log(`  Amenity: ${amenity.name} (${ref.id})`)
  }

  console.log('Seeding complete.')
  console.log(`  Staff: 2 created`)
  console.log(`  Amenities: ${amenities.length} created`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
