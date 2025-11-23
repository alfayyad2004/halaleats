'use client';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Firestore,
  updateDoc,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

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

export async function submitUnrecognizedProduct(
  firestore: Firestore,
  { barcode, email }: { barcode: string; email?: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const productsRef = collection(firestore, 'unrecognizedProducts');
    const q = query(productsRef, where('barcode', '==', barcode));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return {
        success: true,
        message: 'This product has already been submitted for review. Thank you!',
      };
    }

    const newProductData = {
      barcode,
      createdAt: serverTimestamp(),
      reviewed: false,
      submittedByEmail: email || '',
    };

    const docRef = addDoc(productsRef, newProductData);
    docRef.catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: productsRef.path,
            operation: 'create',
            requestResourceData: newProductData,
        });
        errorEmitter.emit('permission-error', permissionError);
    })

    return {
      success: true,
      message: "Thank you for your submission! We'll review it shortly.",
    };
  } catch (error: any) {
    console.error("Error in submitUnrecognizedProduct:", error);
    return {
      success: false,
      message: error.message || "A client-side error occurred while submitting your request.",
    };
  }
}

export async function classifyProduct(
    firestore: Firestore,
    { id, productName, ingredients }: { id: string; productName: string; ingredients: string }
): Promise<{ success: boolean; message: string }> {
    try {
        const productRef = doc(firestore, 'unrecognizedProducts', id);

        const updateData = {
            productName,
            ingredients,
            reviewed: true,
        };

        updateDoc(productRef, updateData).catch(serverError => {
            const permissionError = new FirestorePermissionError({
                path: productRef.path,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });

        return {
          success: true,
          message: 'Product has been classified successfully!',
        };

    } catch (e: any) {
        console.error("Error in classifyProduct:", e);
        return {
            success: false,
            message: e.message || 'An error occurred while classifying the product.',
        };
    }
}
