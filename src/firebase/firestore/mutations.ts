'use client';
import { collection, addDoc, serverTimestamp, getFirestore, query, where, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebase } from "..";
import type { User } from "firebase/auth";
import type { UnrecognizedProduct } from "@/lib/types";

export async function addUnrecognizedProduct(barcode: string, email?: string) {
    const { firestore } = getFirebase();
    if (!firestore) {
        console.error("Firestore not initialized");
        return;
    }

    const productsRef = collection(firestore, "unrecognizedProducts");

    // Check if an un-reviewed product with the same barcode already exists
    const q = query(productsRef, where("barcode", "==", barcode), where("reviewed", "==", false));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        try {
            await addDoc(productsRef, {
                barcode,
                createdAt: serverTimestamp(),
                reviewed: false,
                submittedByEmail: email || '',
            });
        } catch (e) {
            console.error("Error adding unrecognized product: ", e);
            throw e; // Re-throw to be caught by the server action
        }
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

    try {
        await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'user' // Default role for new users
        }, { merge: true });
    } catch (e) {
        console.error("Error creating user profile: ", e);
    }
}

export async function classifyProduct(
  id: string,
  productName: string,
  ingredients: string
): Promise<void> {
    const { firestore } = getFirebase();
    if (!firestore) {
        throw new Error("Firestore not initialized");
    }

    const productRef = doc(firestore, 'unrecognizedProducts', id);

    try {
        await updateDoc(productRef, {
            productName,
            ingredients,
            reviewed: true,
        });
        
        // TODO: In a real app, you would add this to a primary 'products' collection.
        // For now, we just mark it as reviewed.

    } catch (error) {
        console.error("Error updating product:", error);
        throw new Error("Failed to classify product.");
    }
}
