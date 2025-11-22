import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';
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
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return { firebaseApp, auth, firestore };
}

// A global getter to retrieve the initialized Firebase services.
function getFirebase() {
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
