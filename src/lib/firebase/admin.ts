import * as admin from 'firebase-admin';

// This ensures that we only initialize the app once,
// which is a best practice.
if (!admin.apps.length) {
  admin.initializeApp();
}

const firestoreAdmin = admin.firestore();

export const getFirestoreAdmin = () => firestoreAdmin;
