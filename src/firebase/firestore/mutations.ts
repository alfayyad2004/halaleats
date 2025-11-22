'use client';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirebase } from "..";
import type { User } from "firebase/auth";
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function createUserProfile(user: User) {
    const { firestore } = getFirebase();
    if (!firestore) {
        console.error("Firestore not initialized");
        return;
    }

    const userDocRef = doc(firestore, "users", user.uid);
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'user' // Default role for new users
    };

    setDoc(userDocRef, userData, { merge: true })
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'create',
                requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
}

export function classifyProduct(
  id: string,
  productName: string,
  ingredients: string
): Promise<void> {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }

    const productRef = doc(firestore, 'unrecognizedProducts', id);
    const updatedData = {
        productName,
        ingredients,
        reviewed: true,
    };

    return updateDoc(productRef, updatedData)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: productRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
            // Re-throw the original server error so the calling function can handle it
            throw serverError;
        });
}

export async function addUnrecognizedProduct(barcode: string, submittedByEmail?: string) {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }
    const productsRef = collection(firestore, "unrecognizedProducts");

    // 1. Check if a review for this barcode already exists and is pending.
    const q = query(productsRef, where("barcode", "==", barcode), where("reviewed", "==", false));
    
    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // An unreviewed product with this barcode already exists.
            // We can silently succeed to prevent leaking info about submitted products.
            console.log(`Submission for barcode ${barcode} already exists. Skipping.`);
            return;
        }

        // 2. If no pending review exists, add the new product.
        const newProductData = {
            barcode,
            createdAt: serverTimestamp(),
            reviewed: false,
            submittedByEmail: submittedByEmail || '',
        };

        await addDoc(productsRef, newProductData);

    } catch (serverError: any) {
        console.error("Error in addUnrecognizedProduct:", serverError);

        // Check if it's a permission error and emit a contextual error
        if (serverError.code === 'permission-denied') {
             const permissionError = new FirestorePermissionError({
                path: productsRef.path,
                operation: 'list', // The failing operation is the query (`getDocs`)
            });
            errorEmitter.emit('permission-error', permissionError);
        }
       
        // Re-throw a more generic error to the UI
        throw new Error("Could not submit product for review due to a database error.");
    }
}
