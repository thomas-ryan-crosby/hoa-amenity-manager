import { initializeApp, getApps, cert, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getAuth, Auth } from 'firebase-admin/auth'
import { getStorage, Storage } from 'firebase-admin/storage'

let app: App
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (serviceAccount) {
    app = initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    })
  } else {
    // Falls back to GOOGLE_APPLICATION_CREDENTIALS or default credentials
    app = initializeApp()
  }
} else {
  app = getApps()[0]
}

export const adminDb: Firestore = getFirestore(app)
export const adminAuth: Auth = getAuth(app)
export const adminStorage: Storage = getStorage(app)
