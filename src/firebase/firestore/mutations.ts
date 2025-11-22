'use client';
import { collection, addDoc, serverTimestamp, getFirestore, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import { getFirebase } from "..";
import type { User } from "firebase/auth";

export async function addUnrecognizedProduct(barcode: string) {
    const { firestore } = getFirebase();
    if (!firestore) {
        console.error("Firestore not initialized");
        return;
    }

    const productsRef = collection(firestore, "unrecognizedProducts");

    // Check if the barcode already exists
    const q = query(productsRef, where("barcode", "==", barcode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        // Barcode doesn't exist, so add it
        try {
            await addDoc(productsRef, {
                barcode,
                createdAt: serverTimestamp(),
                reviewed: false,
                productName: '',
                ingredients: '',
            });
        } catch (e) {
            console.error("Error adding unrecognized product: ", e);
        }
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
        });
    } catch (e) {
        console.error("Error creating user profile: ", e);
    }
}
