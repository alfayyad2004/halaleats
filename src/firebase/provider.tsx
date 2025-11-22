
'use client';
import { ReactNode, createContext, useContext } from 'react';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export interface FirebaseContextType {
  auth: Auth;
  firestore: Firestore;
  firebaseApp: FirebaseApp;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({
  children,
  auth,
  firestore,
  firebaseApp,
}: {
  children: ReactNode;
  auth: Auth;
  firestore: Firestore;
  firebaseApp: FirebaseApp;
}) {
  const contextValue = { auth, firestore, firebaseApp };

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
}

export function useFirestore() {
  const context = useContext(FirebaseContext);
  if (context === null) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context;
}
