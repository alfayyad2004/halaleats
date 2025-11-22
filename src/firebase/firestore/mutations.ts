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

export async function addUnrecognizedProduct(barcode: string, email: string): Promise<{ success: boolean; message: string; }> {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }

    const productsRef = collection(firestore, "unrecognizedProducts");

    // Query to check for an existing, unreviewed product with the same barcode.
    const q = query(productsRef, where("barcode", "==", barcode), where("reviewed", "==", false));
    
    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return {
                success: true, // It's not a failure, just a duplicate.
                message: 'This product has already been submitted for review. Thank you!',
            };
        }
    
        // No pending review found, so add the new product.
        const newProductData = {
            barcode,
            createdAt: serverTimestamp(),
            reviewed: false,
            submittedByEmail: email || '',
        };

        await addDoc(productsRef, newProductData);

        return {
            success: true,
            message: "Thank you for your submission! We'll review it shortly.",
        };
    } catch (error: any) {
         console.error("Error adding unrecognized product: ", error);
        // This will be caught by the server action and a generic message will be returned.
        // We throw the error to propagate the failure.
        throw new Error("Failed to submit product review.", { cause: error });
    }
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
            throw serverError;
        });
}
