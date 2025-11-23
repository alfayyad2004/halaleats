'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore'

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

function initializeFirebaseServices() {
  if (firebaseConfig && firebaseConfig.apiKey) {
    if (!getApps().length) {
      try {
        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);
        firestore = getFirestore(firebaseApp);
      } catch (error) {
        console.error("Firebase initialization error:", error);
      }
    } else {
      firebaseApp = getApp();
      auth = getAuth(firebaseApp);
      firestore = getFirestore(firebaseApp);
    }
  } else {
    console.error("Firebase initialization failed: Firebase API Key is missing. Please check your environment variables.");
  }
}

// Call initialization
initializeFirebaseServices();


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  // This function can be used to re-initalize if needed,
  // but primary initialization happens above.
  if (!firebaseApp) {
    initializeFirebaseServices();
  }
  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './errors';
export * from './error-emitter';
