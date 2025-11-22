'use client';

import { ReactNode, useEffect, useState } from 'react';
import { FirebaseProvider, FirebaseContextType } from './provider';
import { initializeFirebase } from '.';
import { Loader } from 'lucide-react';

// This is a client-side provider that initializes Firebase and provides the app instance to its children.
// This ensures that Firebase is initialized only once on the client.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<FirebaseContextType | null>(null);

  useEffect(() => {
    // Only run this on the client
    if (typeof window !== 'undefined') {
      try {
        const { firebaseApp, auth, firestore } = initializeFirebase();
        setServices({ firebaseApp, auth, firestore });
      } catch (error: any) {
        console.error("Firebase initialization failed:", error.message);
        // Render an error state or handle it as appropriate
      }
    }
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
