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
    const q = query(productsRef, where("barcode", "==", barcode), where("reviewed", "==", false));

    try {
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

        const docRef = await addDoc(productsRef, newProductData);

        return {
            success: true,
            message: "Thank you for your submission! We'll review it shortly.",
        };
    } catch (serverError: any) {
        const operation = serverError.code === 'permission-denied' ? (serverError.message.includes('list') ? 'list' : 'create') : 'write';
        const permissionError = new FirestorePermissionError({
            path: productsRef.path,
            operation: operation,
            requestResourceData: { barcode, email },
        });
        errorEmitter.emit('permission-error', permissionError);
        
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
            throw serverError;
        });
}
