import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { FirebaseProvider, useAuth, useFirestore } from './provider';
import { FirebaseClientProvider } from './client-provider';
import { useUser } from './auth/use-user';
import { useCollection } from './firestore/use-collection';


// This function is not used in the new client-side only setup.
// Keeping it here in case it's needed for server-side logic in the future.
// The primary initialization now happens in FirebaseClientProvider.
function getFirebase() {
  const { auth, firestore } = useAuth();
  if (!auth || !firestore) {
    throw new Error('Firebase has not been initialized. Please use `useAuth` inside a `FirebaseProvider`.');
  }
  return { auth, firestore };
}

export {
  FirebaseProvider,
  FirebaseClientProvider,
  useUser,
  useCollection,
  useAuth,
  useFirestore,
  getFirebase,
};
export type { FirebaseApp, Auth, Firestore };
