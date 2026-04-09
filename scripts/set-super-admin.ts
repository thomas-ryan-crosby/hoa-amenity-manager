/**
 * Set superAdmin custom claim on a Firebase user.
 *
 * Usage:
 *   npx tsx scripts/set-super-admin.ts <email-or-uid>
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: npx tsx scripts/set-super-admin.ts <email-or-uid>')
    process.exit(1)
  }

  if (!getApps().length) {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    if (serviceAccount) {
      initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
    } else {
      initializeApp()
    }
  }

  const auth = getAuth()

  // Resolve email to UID if needed
  let user
  if (input.includes('@')) {
    user = await auth.getUserByEmail(input)
  } else {
    user = await auth.getUser(input)
  }

  const existingClaims = user.customClaims ?? {}

  await auth.setCustomUserClaims(user.uid, {
    ...existingClaims,
    superAdmin: true,
  })

  console.log(`Set superAdmin=true for ${user.email} (${user.uid})`)
  console.log('User must sign out and back in for the claim to take effect.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
