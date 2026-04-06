/**
 * Set superAdmin custom claim on a Firebase user.
 *
 * Usage:
 *   npx tsx scripts/set-super-admin.ts <firebase-uid>
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env var or default credentials.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

async function main() {
  const uid = process.argv[2]
  if (!uid) {
    console.error('Usage: npx tsx scripts/set-super-admin.ts <firebase-uid>')
    process.exit(1)
  }

  // Initialize Firebase Admin
  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccount) {
      initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
    } else {
      initializeApp()
    }
  }

  const auth = getAuth()
  const user = await auth.getUser(uid)
  const existingClaims = user.customClaims ?? {}

  await auth.setCustomUserClaims(uid, {
    ...existingClaims,
    superAdmin: true,
  })

  console.log(`Successfully set superAdmin=true for user ${uid} (${user.email})`)
  console.log('Existing claims preserved:', existingClaims)
  console.log(
    'Note: The user must sign out and sign back in (or refresh their token) for the new claim to take effect.',
  )
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
