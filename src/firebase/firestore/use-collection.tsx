'use client';
import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  DocumentData,
  FirestoreError,
  Query,
  CollectionReference,
  Unsubscribe,
} from 'firebase/firestore';
import { useFirestore } from '..';

interface UseCollectionOptions {
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  filter?: {
    field: string;
    operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
    value: any;
  };
  limit?: number;
}

export function useCollection<T>(collectionName: string, options: UseCollectionOptions = {}) {
  const { firestore } = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!firestore) return;

    let collectionRef: Query | CollectionReference = collection(firestore, collectionName);

    if (options.filter) {
      collectionRef = query(collectionRef, where(options.filter.field, options.filter.operator, options.filter.value));
    }

    if (options.sort) {
      collectionRef = query(collectionRef, orderBy(options.sort.field, options.sort.order));
    }
    
    if (options.limit) {
      collectionRef = query(collectionRef, limit(options.limit));
    }


    const unsubscribe: Unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          result.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(result);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, firestore, options.filter, options.sort, options.limit]);

  return { data, loading, error };
}
