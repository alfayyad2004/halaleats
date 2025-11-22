'use client';
import { collection, addDoc, serverTimestamp, getDocs, query, where, doc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebase } from "..";
import type { User } from "firebase/auth";
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export async function addUnrecognizedProduct(barcode: string, email?: string) {
    const { firestore } = getFirebase();
    if (!firestore) {
        console.error("Firestore not initialized");
        return;
    }

    const productsRef = collection(firestore, "unrecognizedProducts");

    const q = query(productsRef, where("barcode", "==", barcode), where("reviewed", "==", false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const newProductData = {
            barcode,
            createdAt: serverTimestamp(),
            reviewed: false,
            submittedByEmail: email || '',
        };
        addDoc(productsRef, newProductData)
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: productsRef.path,
                    operation: 'create',
                    requestResourceData: newProductData,
                });
                errorEmitter.emit('permission-error', permissionError);
                console.error("Error adding unrecognized product: ", serverError);
                throw serverError; // Re-throw to be caught by the server action
            });

    } else {
        console.log(`Barcode ${barcode} already submitted for review.`);
    }
}

export async function createUserProfile(user: User) {
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
                operation: 'write',
                requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
            console.error("Error creating user profile: ", serverError);
        });
}

export function classifyProduct(
  id: string,
  productName: string,
  ingredients: string
): void {
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

    updateDoc(productRef, updatedData)
        .catch((serverError) => {
            const permissionError = new FirestorePermissionError({
                path: productRef.path,
                operation: 'update',
                requestResourceData: updatedData,
            });
            errorEmitter.emit('permission-error', permissionError);
            // We still throw here so the component's error handling can catch it
            // and show a toast to the user.
            throw serverError;
        });
}
