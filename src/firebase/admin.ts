'use server';

import * as admin from 'firebase-admin';

// This function safely initializes the Firebase Admin SDK and returns the Firestore instance.
// It ensures that initialization only happens once.
export function getFirestoreAdmin() {
  if (!admin.apps.length) {
    // When deployed on App Hosting, initializeApp() discovers credentials automatically.
    admin.initializeApp();
  }
  return admin.firestore();
}
