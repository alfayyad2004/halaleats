'use client';
import { collection, addDoc, serverTimestamp, getFirestore, query, where, getDocs } from "firebase/firestore";
import { getFirebase } from "..";

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
