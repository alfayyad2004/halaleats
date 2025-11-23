'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
  query,
  orderBy,
  limit,
  where,
  QueryConstraint,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useFirestore } from '../provider';


/** Utility type to add an 'id' field to a given type T. */
export type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useCollection hook.
 * @template T Type of the document data.
 */
export interface UseCollectionResult<T> {
  data: WithId<T>[];
  loading: boolean;
  error: FirestoreError | Error | null;
}

/* Internal implementation of Query:
  https://github.com/firebase/firebase-js-sdk/blob/c5f08a9bc5da0d2b0207802c972d53724ccef055/packages/firestore/src/lite-api/reference.ts#L143
*/
export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export type CollectionOptions = {
    sort?: { field: string; order: 'asc' | 'desc' };
    limit?: number;
    where?: [string, '==', any]; // Simple where clause for now
    disabled?: boolean;
};

/**
 * React hook to subscribe to a Firestore collection or query in real-time.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {string} path - The path to the Firestore collection.
 * @param {CollectionOptions} options - Options for sorting, limiting, and filtering.
 * @returns {UseCollectionResult<T>} Object with data, loading, error.
 */
export function useCollection<T = any>(
    path: string,
    options: CollectionOptions = {}
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;

  const [data, setData] = useState<ResultItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || options.disabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const collectionRef = query(firestore, path);
    const constraints: QueryConstraint[] = [];

    if (options.where) {
        constraints.push(where(...options.where));
    }
    if (options.sort) {
        constraints.push(orderBy(options.sort.field, options.sort.order));
    }
    if (options.limit) {
        constraints.push(limit(options.limit));
    }
    
    const finalQuery = query(collectionRef, ...constraints);

    const unsubscribe = onSnapshot(
      finalQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id
        }));

        setData(results);
        setError(null);
        setLoading(false);
      },
      (error: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path: (finalQuery as unknown as InternalQuery)._query.path.canonicalString(),
        });

        setError(contextualError);
        setData([]);
        setLoading(false);

        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestore, path, JSON.stringify(options.where), JSON.stringify(options.sort), options.limit, options.disabled]);

  return { data, loading, error };
}
