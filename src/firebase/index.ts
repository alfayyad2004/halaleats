import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { FirebaseProvider, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider, useFirebaseApp } from './client-provider';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

/**
 * Initializes Firebase and returns the app, auth, and firestore instances.
 * This function ensures that Firebase is initialized only once.
 * 
 * @returns An object containing the Firebase app, auth, and firestore instances.
 */
function initializeFirebase() {
  if (!getApps().length) {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  } else {
    firebaseApp = getApps()[0];
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return { firebaseApp, auth, firestore };
}

// A global getter to retrieve the initialized Firebase services.
function getFirebase() {
    if (!auth || !firestore) {
        initializeFirebase();
    }
    return { auth, firestore };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useCollection,
  useAuth,
  useFirestore,
  useFirebaseApp,
  getFirebase,
};
