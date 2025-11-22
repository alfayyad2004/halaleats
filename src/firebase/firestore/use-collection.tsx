
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
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

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
        setError(null);
      },
      (err) => {
        if (err.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: (collectionRef as CollectionReference).path,
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  // We stringify the options to avoid re-running the effect on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, firestore, JSON.stringify(options)]);

  return { data, loading, error };
}
