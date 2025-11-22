'use client';

import { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

import { useAuth, useFirestore } from '../';

// A custom type that extends the Firebase User type with a `role` property.
export type AppUser = User & {
  role: 'admin' | 'user';
};

/**
 * A hook that provides the currently authenticated user.
 * It also fetches the user's custom claims to determine their role.
 * 
 * @returns An object containing the `AppUser`, `user`, `loading`, `auth` and `firestore` instances.
 * `AppUser` is a custom type that extends the Firebase User type with a `role` property.
 * `user` is the original Firebase User object.
 */
export function useUser() {
  const { auth, firestore } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firestore) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      setUser(user);

      if (user) {
        // Listen for changes to the user's profile document in Firestore
        // to get the custom role claim.
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsub = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setAppUser({ ...user, role: data.role || 'user' } as AppUser);
          } else {
            setAppUser({ ...user, role: 'user' } as AppUser);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setAppUser({ ...user, role: 'user' } as AppUser); // Fallback to 'user' role on error
          setLoading(false);
        });
        return () => unsub();
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, firestore]);

  return { appUser, user, loading, auth, firestore };
}
