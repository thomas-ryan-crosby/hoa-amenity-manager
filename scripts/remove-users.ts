/**
 * Remove users and all associated data from Firestore and Firebase Auth.
 *
 * Usage: npx tsx scripts/remove-users.ts
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { readFileSync } from 'fs'

// Load .env.local
const envFile = readFileSync('.env.local', 'utf-8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
if (!serviceAccountKey) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY not set')

const app = initializeApp({ credential: cert(JSON.parse(serviceAccountKey)) })
const db = getFirestore(app)
const auth = getAuth(app)

const EMAILS_TO_REMOVE = [
  'ryan@kellby.com',
  'ryan@wetlandx.com',
  'ryan@crosbydevelopment.com',
]

async function removeUser(email: string) {
  console.log(`\n--- Processing ${email} ---`)

  // Find Firebase Auth user
  let uid: string | null = null
  try {
    const user = await auth.getUserByEmail(email)
    uid = user.uid
    console.log(`  Firebase UID: ${uid}`)
  } catch {
    console.log(`  No Firebase Auth account found`)
  }

  // Find resident record
  let residentId: string | null = null
  const residentSnap = await db.collection('residents')
    .where('email', '==', email)
    .get()
  if (!residentSnap.empty) {
    residentId = residentSnap.docs[0].id
    console.log(`  Resident ID: ${residentId}`)
  }

  // Also check by firebaseUid
  if (uid && !residentId) {
    const byUid = await db.collection('residents')
      .where('firebaseUid', '==', uid)
      .get()
    if (!byUid.empty) {
      residentId = byUid.docs[0].id
      console.log(`  Resident ID (by UID): ${residentId}`)
    }
  }

  // Delete bookings by residentId
  if (residentId) {
    const bookingsSnap = await db.collection('bookings')
      .where('residentId', '==', residentId)
      .get()
    console.log(`  Bookings: ${bookingsSnap.size}`)
    for (const doc of bookingsSnap.docs) {
      // Delete associated turn windows
      const twSnap = await db.collection('turnWindows')
        .where('bookingId', '==', doc.id)
        .get()
      for (const tw of twSnap.docs) {
        await tw.ref.delete()
        console.log(`    Deleted turn window ${tw.id}`)
      }

      // Delete associated audit logs
      const auditSnap = await db.collection('auditLogs')
        .where('bookingId', '==', doc.id)
        .get()
      for (const al of auditSnap.docs) {
        await al.ref.delete()
      }
      if (auditSnap.size > 0) console.log(`    Deleted ${auditSnap.size} audit logs`)

      await doc.ref.delete()
      console.log(`    Deleted booking ${doc.id}`)
    }
  }

  // Delete community memberships
  if (uid) {
    const membersSnap = await db.collection('communityMembers')
      .where('userId', '==', uid)
      .get()
    for (const doc of membersSnap.docs) {
      await doc.ref.delete()
      console.log(`  Deleted community membership ${doc.id}`)
    }
  }

  // Delete pending admin invites
  const inviteSnap = await db.collection('pendingAdminInvites')
    .where('email', '==', email.toLowerCase())
    .get()
  for (const doc of inviteSnap.docs) {
    await doc.ref.delete()
    console.log(`  Deleted pending invite ${doc.id}`)
  }

  // Delete resident record
  if (residentId) {
    await db.collection('residents').doc(residentId).delete()
    console.log(`  Deleted resident record`)
  }

  // Delete Firebase Auth account
  if (uid) {
    await auth.deleteUser(uid)
    console.log(`  Deleted Firebase Auth account`)
  }

  console.log(`  Done.`)
}

async function main() {
  for (const email of EMAILS_TO_REMOVE) {
    await removeUser(email)
  }
  console.log('\nAll done.')
}

main().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
