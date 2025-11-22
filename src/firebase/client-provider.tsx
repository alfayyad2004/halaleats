'use client';

import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { FirebaseProvider, FirebaseContextType } from './provider';
import { Loader } from 'lucide-react';

// Create a context for the Firebase app instance.
const FirebaseAppContext = createContext<FirebaseApp | null>(null);

/**
 * A client-side provider that initializes Firebase and provides the app instance to its children.
 * This ensures that Firebase is initialized only once on the client.
 * 
 * @param {ReactNode} children The child components to render.
 */
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client side where process.env is available.
    if (typeof window !== 'undefined' && !services) {
        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };

        if (!firebaseConfig.apiKey) {
            console.error("Firebase API Key is missing. Please check your .env.local file.");
            return;
        }

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        
        setServices({
            auth,
            firestore,
            firebaseApp: app,
        });
    }
  }, [services]);

  if (!services) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <FirebaseAppContext.Provider value={services.firebaseApp}>
      <FirebaseProvider
        auth={services.auth}
        firestore={services.firestore}
        firebaseApp={services.firebaseApp}
      >
        {children}
      </FirebaseProvider>
    </FirebaseAppContext.Provider>
  );
}

/**
 * A hook to get the Firebase app instance.
 * @returns {FirebaseApp} The Firebase app instance.
 */
export function useFirebaseApp() {
  const app = useContext(FirebaseAppContext);
  if (!app) {
    throw new Error('useFirebaseApp must be used within a FirebaseClientProvider');
  }
  return app;
}
