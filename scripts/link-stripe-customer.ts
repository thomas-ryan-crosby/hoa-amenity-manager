/**
 * Link a Stripe customer ID to a community.
 * Usage: npx tsx scripts/link-stripe-customer.ts <community-slug> <stripe-customer-id>
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'

const envFile = readFileSync('.env.local', 'utf-8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)) })
const db = getFirestore(app)

async function main() {
  const slug = process.argv[2]
  const customerId = process.argv[3]
  if (!slug || !customerId) {
    console.error('Usage: npx tsx scripts/link-stripe-customer.ts <community-slug> <stripe-customer-id>')
    process.exit(1)
  }

  const snap = await db.collection('communities').where('slug', '==', slug).limit(1).get()
  if (snap.empty) { console.error(`Community "${slug}" not found`); process.exit(1) }

  const doc = snap.docs[0]
  await doc.ref.update({ stripeCustomerId: customerId })
  console.log(`Linked ${customerId} to community "${slug}" (${doc.id})`)
}

main().catch((err) => { console.error(err); process.exit(1) })
