'use client';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebase } from "..";
import type { User } from "firebase/auth";
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export async function addUnrecognizedProduct(barcode: string, email?: string) {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }

    const productsRef = collection(firestore, "unrecognizedProducts");
    // Query to check if an identical barcode has already been submitted and is pending review.
    const q = query(productsRef, where("barcode", "==", barcode), where("reviewed", "==", false));

    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // A pending review for this barcode already exists.
            return {
                success: true, // Not a failure, just a duplicate submission.
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
    } catch (serverError: any) {
        // This will catch permission errors on either getDocs or addDoc
        const operation = serverError.message.includes('permission-denied') ? 'list' : 'create';
        const permissionError = new FirestorePermissionError({
            path: productsRef.path,
            operation: operation,
            requestResourceData: operation === 'create' ? { barcode, email } : undefined,
        });
        errorEmitter.emit('permission-error', permissionError);
        
        // Re-throw to be caught by the server action
        throw serverError;
    }
}


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

    // Do not await. Let the UI continue and handle the error in the background.
    setDoc(userDocRef, userData, { merge: true })
        .catch((serverError) => {
            // Create a rich, contextual error and emit it globally.
            const permissionError = new FirestorePermissionError({
                path: userDocRef.path,
                operation: 'write', 
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

    // Return the promise from updateDoc
    return updateDoc(productRef, updatedData)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: productRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
            // Re-throw the original server error so the calling action knows about the failure.
            throw serverError;
        });
}
