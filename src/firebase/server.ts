import admin from 'firebase-admin';

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized && admin.apps.length) {
    return { firestore: admin.firestore(), admin };
  }

  // Try to initialize with GOOGLE_APPLICATION_CREDENTIALS or environment variables.
  try {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    initialized = true;
    return { firestore: admin.firestore(), admin };
  } catch (e) {
    // Re-throw with helpful message for devs
    console.error('Failed to initialize Firebase Admin SDK. Ensure service account credentials are available in the environment.', e);
    throw e;
  }
}

export default initializeFirebaseAdmin;
