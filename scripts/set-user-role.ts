import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin directly (standalone script)
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccount) {
    initializeApp({ credential: cert(JSON.parse(serviceAccount)) })
  } else {
    initializeApp()
  }
}

const auth = getAuth()

async function main() {
  const [uid, role] = process.argv.slice(2)

  if (!uid || !role) {
    console.error('Usage: ts-node scripts/set-user-role.ts <firebase-uid> <role>')
    console.error('Roles: resident, admin, janitorial, property_manager')
    process.exit(1)
  }

  await auth.setCustomUserClaims(uid, { role })

  const user = await auth.getUser(uid)
  console.log(`Set custom claims for user ${user.email ?? uid}:`)
  console.log(`  role: ${role}`)
  console.log('Done. The user must sign out and back in for claims to take effect.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
