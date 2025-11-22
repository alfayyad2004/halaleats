'use client';
import { doc, setDoc, updateDoc, getDocs, collection, query, where, serverTimestamp, addDoc } from "firebase/firestore";
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


export async function submitUnrecognizedProduct(barcode: string, email?: string): Promise<void> {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }

    const productsRef = collection(firestore, 'unrecognizedProducts');
    const q = query(productsRef, where("barcode", "==", barcode));

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        console.log("Product with this barcode already submitted.");
        // We can just return successfully to give the user a consistent experience
        return;
    }
    
    const newProductData = {
        barcode,
        createdAt: serverTimestamp(),
        reviewed: false,
        submittedByEmail: email || '',
    };
    
    // Use `addDoc` which will trigger a permission error if rules are not set correctly.
    // The promise rejection will be caught by the server action.
    await addDoc(productsRef, newProductData);
}
