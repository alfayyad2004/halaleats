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

export async function submitUnrecognizedProduct(
    { barcode, submittedByEmail }: { barcode: string, submittedByEmail?: string | null }
): Promise<{ success: boolean, message: string }> {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }

    const productsRef = collection(firestore, "unrecognizedProducts");

    try {
        // Query to check for an existing, unreviewed product with the same barcode.
        const q = query(productsRef, where("barcode", "==", barcode));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return {
                success: true,
                message: "Thank you for your submission! This product is already in our review queue.",
            };
        }

        // No pending review found, so add the new product.
        await addDoc(productsRef, {
            barcode,
            createdAt: serverTimestamp(),
            reviewed: false,
            submittedByEmail: submittedByEmail || '',
        });

        return {
            success: true,
            message: "Thank you for your submission! We'll review it shortly.",
        };
    } catch (error: any) {
        console.error("Error in submitUnrecognizedProduct:", error);
        if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
                path: productsRef.path,
                operation: 'list', // The query is a 'list' operation
            });
            errorEmitter.emit('permission-error', permissionError);
             throw new Error("You don't have permission to submit a review. Please check your network and try again.");
        }
        // Do not expose detailed internal errors to the client.
        throw new Error("A server error occurred while submitting the product.");
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
            // Re-throw the original server error so the calling function can handle it
            throw serverError;
        });
}
