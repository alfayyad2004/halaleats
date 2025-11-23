'use client';
import {
  doc,
  setDoc,
  Firestore,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import { initializeFirebase } from '..';

export function createUserProfile(firestore: Firestore, user: User) {
  if (!firestore) {
    console.error('Firestore not initialized');
    return;
  }

  const userDocRef = doc(firestore, 'users', user.uid);
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: 'user', // Default role for new users
  };

  setDoc(userDocRef, userData, { merge: true }).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: userDocRef.path,
      operation: 'create',
      requestResourceData: userData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

// This is a client-side mutation.
export async function submitUnrecognizedProduct(data: {
  barcode: string;
  email?: string;
}) {
  // We must initialize firebase here because this can be called from a server action
  const { firestore } = initializeFirebase();
  const { barcode, email } = data;

  const productsRef = collection(firestore, 'unrecognizedProducts');
  const q = query(productsRef, where('barcode', '==', barcode));

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Product already exists, we can just return silently or with a specific message if needed.
    return {
      message:
        'Thank you for your submission! This product is already in our review queue.',
    };
  }

  const newProductData = {
    barcode,
    createdAt: serverTimestamp(),
    reviewed: false,
    submittedByEmail: email || '',
  };

  return addDoc(productsRef, newProductData).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: productsRef.path,
      operation: 'create',
      requestResourceData: newProductData,
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw to allow the server action to catch it.
    throw permissionError;
  });
}

// This is a client-side mutation.
export async function classifyProduct(data: {
  id: string;
  productName: string;
  ingredients: string;
}) {
  const { firestore } = initializeFirebase();
  const { id, productName, ingredients } = data;
  const productRef = doc(firestore, 'unrecognizedProducts', id);

  return updateDoc(productRef, {
    productName,
    ingredients,
    reviewed: true,
  }).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: productRef.path,
      operation: 'update',
      requestResourceData: { productName, ingredients, reviewed: true },
    });
    errorEmitter.emit('permission-error', permissionError);
    // Re-throw to allow the server action to catch it.
    throw permissionError;
  });
}
