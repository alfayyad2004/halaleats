'use client';

import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider, FirebaseContextType } from './provider';
import { Loader } from 'lucide-react';

// This is a client-side provider that initializes Firebase and provides the app instance to its children.
// This ensures that Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    // Only run this on the client
    if (typeof window === 'undefined') {
      return;
    }

    // Check if Firebase is already initialized
    if (getApps().length > 0) {
      const app = getApps()[0];
      setServices({
        firebaseApp: app,
        auth: getAuth(app),
        firestore: getFirestore(app),
      });
      return;
    }
    
    // Initialize Firebase
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    // Validate config
    if (!firebaseConfig.apiKey) {
      console.error("Firebase API Key is missing. Please check your .env.local file.");
      // You might want to render an error state here
      return;
    }

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    setServices({
      firebaseApp: app,
      auth,
      firestore,
    });
  }, []);

  if (!services) {
    // While Firebase is initializing, show a loader.
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  // Once initialized, provide the services to the rest of the app.
  return (
    <FirebaseProvider
      auth={services.auth}
      firestore={services.firestore}
      firebaseApp={services.firebaseApp}
    >
      {children}
    </FirebaseProvider>
  );
}
