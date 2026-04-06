import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

const app = initializeApp({ credential: applicationDefault() })
const db = getFirestore(app)
const auth = getAuth(app)

const COMMUNITY_NAME = 'Sanctuary HOA'
const COMMUNITY_SLUG = 'sanctuary'
const SUPER_ADMIN_EMAIL = 'thomas.ryan.crosby@gmail.com'

const BATCH_SIZE = 400 // Firestore batch limit is 500, leave headroom

// Collections that need communityId added
const COLLECTIONS_TO_TAG = [
  'amenities',
  'areas',
  'bookings',
  'turnWindows',
  'inspectionReports',
  'auditLogs',
]

async function migrate() {
  console.log('Starting multi-community migration...')
  console.log('='.repeat(60))

  // -----------------------------------------------------------------------
  // 1. Create default community (idempotent)
  // -----------------------------------------------------------------------
  console.log('\n[Step 1] Creating default community...')
  const communityId = await ensureCommunity()
  console.log(`  Community ID: ${communityId}`)

  // -----------------------------------------------------------------------
  // 2. Add communityId to all collections
  // -----------------------------------------------------------------------
  console.log('\n[Step 2] Adding communityId to documents...')
  for (const collectionName of COLLECTIONS_TO_TAG) {
    await tagCollection(collectionName, communityId)
  }

  // Tag booking auditLogs subcollections
  await tagBookingAuditLogs(communityId)

  // -----------------------------------------------------------------------
  // 3. Create CommunityMember records for existing residents
  // -----------------------------------------------------------------------
  console.log('\n[Step 3] Creating CommunityMember records...')
  await createCommunityMembers(communityId)

  // -----------------------------------------------------------------------
  // 4. Copy settings from /settings/global to /communities/{id}/settings
  // -----------------------------------------------------------------------
  console.log('\n[Step 4] Copying global settings to community...')
  await copySettings(communityId)

  // -----------------------------------------------------------------------
  // 5. Set super-admin flag on the designated account
  // -----------------------------------------------------------------------
  console.log('\n[Step 5] Setting super-admin flag...')
  await setSuperAdmin()

  console.log('\n' + '='.repeat(60))
  console.log('Migration complete!')
}

// ---------------------------------------------------------------------------
// Step 1: Create or find the default community
// ---------------------------------------------------------------------------
async function ensureCommunity(): Promise<string> {
  // Check if community with this slug already exists
  const existing = await db
    .collection('communities')
    .where('slug', '==', COMMUNITY_SLUG)
    .limit(1)
    .get()

  if (!existing.empty) {
    console.log(`  Community "${COMMUNITY_NAME}" already exists, skipping creation.`)
    return existing.docs[0].id
  }

  const ref = db.collection('communities').doc()
  await ref.set({
    name: COMMUNITY_NAME,
    slug: COMMUNITY_SLUG,
    address: null,
    city: null,
    state: null,
    zip: null,
    logoUrl: null,
    contactEmail: null,
    contactPhone: null,
    plan: 'premium',
    isActive: true,
    maxAmenities: 100,
    maxMembers: 1000,
    createdAt: Timestamp.now(),
    createdBy: 'migration-script',
  })

  console.log(`  Created community "${COMMUNITY_NAME}".`)
  return ref.id
}

// ---------------------------------------------------------------------------
// Step 2: Tag all documents in a collection with communityId
// ---------------------------------------------------------------------------
async function tagCollection(collectionName: string, communityId: string) {
  const colRef = db.collection(collectionName)
  const snapshot = await colRef.get()

  let updated = 0
  let skipped = 0
  let batch = db.batch()
  let batchCount = 0

  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.communityId) {
      skipped++
      continue
    }

    batch.update(doc.ref, { communityId })
    batchCount++
    updated++

    if (batchCount >= BATCH_SIZE) {
      await batch.commit()
      batch = db.batch()
      batchCount = 0
    }
  }

  if (batchCount > 0) {
    await batch.commit()
  }

  console.log(`  ${collectionName}: ${updated} updated, ${skipped} already tagged (${snapshot.size} total)`)
}

// ---------------------------------------------------------------------------
// Step 2b: Tag booking subcollection auditLogs
// ---------------------------------------------------------------------------
async function tagBookingAuditLogs(communityId: string) {
  const bookingsSnap = await db.collection('bookings').get()
  let totalUpdated = 0
  let totalSkipped = 0

  for (const bookingDoc of bookingsSnap.docs) {
    const auditLogsSnap = await bookingDoc.ref.collection('auditLogs').get()
    if (auditLogsSnap.empty) continue

    let batch = db.batch()
    let batchCount = 0

    for (const auditDoc of auditLogsSnap.docs) {
      const data = auditDoc.data()
      if (data.communityId) {
        totalSkipped++
        continue
      }

      batch.update(auditDoc.ref, { communityId })
      batchCount++
      totalUpdated++

      if (batchCount >= BATCH_SIZE) {
        await batch.commit()
        batch = db.batch()
        batchCount = 0
      }
    }

    if (batchCount > 0) {
      await batch.commit()
    }
  }

  console.log(`  bookings/*/auditLogs: ${totalUpdated} updated, ${totalSkipped} already tagged`)
}

// ---------------------------------------------------------------------------
// Step 3: Create CommunityMember records
// ---------------------------------------------------------------------------
async function createCommunityMembers(communityId: string) {
  const residentsSnap = await db.collection('residents').get()
  let created = 0
  let skipped = 0

  for (const resDoc of residentsSnap.docs) {
    const resident = resDoc.data()
    const residentId = resDoc.id

    // Check if a communityMember already exists for this resident + community
    const existingMember = await db
      .collection('communityMembers')
      .where('communityId', '==', communityId)
      .where('residentId', '==', residentId)
      .limit(1)
      .get()

    if (!existingMember.empty) {
      skipped++
      continue
    }

    // Read Firebase Auth custom claims to get role
    let role: string = 'resident'
    if (resident.firebaseUid) {
      try {
        const userRecord = await auth.getUser(resident.firebaseUid)
        const claims = userRecord.customClaims || {}
        if (claims.role) {
          role = claims.role
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.log(`    Warning: could not fetch auth for uid ${resident.firebaseUid}: ${msg}`)
      }
    }

    const memberRef = db.collection('communityMembers').doc()
    await memberRef.set({
      communityId,
      userId: resident.firebaseUid || '',
      residentId,
      role,
      status: resident.status || 'approved',
      unitNumber: resident.unitNumber || '',
      joinedAt: resident.createdAt || Timestamp.now(),
      approvedBy: null,
      approvedAt: null,
    })

    created++
    console.log(`    Created member for ${resident.email || residentId} (role: ${role})`)
  }

  console.log(`  CommunityMembers: ${created} created, ${skipped} already existed (${residentsSnap.size} residents total)`)
}

// ---------------------------------------------------------------------------
// Step 4: Copy global settings to community subcollection
// ---------------------------------------------------------------------------
async function copySettings(communityId: string) {
  const globalSettingsDoc = await db.collection('settings').doc('global').get()

  if (!globalSettingsDoc.exists) {
    console.log('  No global settings found, skipping.')
    return
  }

  const communitySettingsRef = db
    .collection('communities')
    .doc(communityId)
    .collection('settings')
    .doc('general')

  const existingSettings = await communitySettingsRef.get()
  if (existingSettings.exists) {
    console.log('  Community settings already exist, skipping.')
    return
  }

  const settingsData = globalSettingsDoc.data()!
  await communitySettingsRef.set({
    ...settingsData,
    migratedFrom: 'settings/global',
    migratedAt: Timestamp.now(),
  })

  console.log('  Copied global settings to community.')
}

// ---------------------------------------------------------------------------
// Step 5: Set super-admin custom claim
// ---------------------------------------------------------------------------
async function setSuperAdmin() {
  try {
    const userRecord = await auth.getUserByEmail(SUPER_ADMIN_EMAIL)
    const existingClaims = userRecord.customClaims || {}

    if (existingClaims.superAdmin) {
      console.log(`  ${SUPER_ADMIN_EMAIL} is already a super-admin, skipping.`)
      return
    }

    await auth.setCustomUserClaims(userRecord.uid, {
      ...existingClaims,
      superAdmin: true,
    })

    console.log(`  Set superAdmin=true on ${SUPER_ADMIN_EMAIL} (uid: ${userRecord.uid})`)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`  Error setting super-admin: ${msg}`)
    console.error('  You may need to set this manually after migration.')
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
