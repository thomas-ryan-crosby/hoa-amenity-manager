/**
 * One-time script: patch all Firestore documents missing a communityId
 * by assigning them to the Sanctuary community.
 *
 * Run with:
 *   GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json npx tsx scripts/patch-orphaned-docs.ts
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
if (!serviceAccountKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local')

const app = initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) })
const db = getFirestore(app)

const COMMUNITY_SLUG = 'sanctuary'

const COLLECTIONS = [
  'amenities',
  'areas',
  'bookings',
  'turnWindows',
  'staff',
  'blackoutDates',
]

async function findSanctuaryId(): Promise<string> {
  const snap = await db.collection('communities').where('slug', '==', COMMUNITY_SLUG).limit(1).get()
  if (snap.empty) throw new Error(`Community with slug "${COMMUNITY_SLUG}" not found`)
  return snap.docs[0].id
}

async function patchCollection(collection: string, communityId: string) {
  const snap = await db.collection(collection).get()
  let patched = 0
  let skipped = 0

  const batch = db.batch()
  let batchCount = 0

  for (const doc of snap.docs) {
    const data = doc.data()
    if (data.communityId) {
      skipped++
      continue
    }

    batch.update(doc.ref, { communityId })
    patched++
    batchCount++

    if (batchCount >= 400) {
      await batch.commit()
      batchCount = 0
      console.log(`  ... committed batch for ${collection}`)
    }
  }

  if (batchCount > 0) {
    await batch.commit()
  }

  console.log(`  ${collection}: ${patched} patched, ${skipped} already had communityId (${snap.size} total)`)
  return patched
}

async function main() {
  console.log('Finding Sanctuary community...')
  const communityId = await findSanctuaryId()
  console.log(`Sanctuary ID: ${communityId}\n`)

  let totalPatched = 0

  for (const collection of COLLECTIONS) {
    const count = await patchCollection(collection, communityId)
    totalPatched += count
  }

  console.log(`\nDone. ${totalPatched} documents patched with communityId: ${communityId}`)
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
