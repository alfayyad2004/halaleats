'use server';

import * as admin from 'firebase-admin';
import { z } from 'zod';

// Initialize Firebase Admin SDK
// This must happen once at the top level.
if (!admin.apps.length) {
    try {
        admin.initializeApp();
    } catch(e) {
        console.error('Firebase Admin SDK initialization error', e);
    }
}

const firestore = admin.firestore();

const SubmitReviewSchema = z.object({
  barcode: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
});

export async function submitReviewAction(prevState: any, formData: FormData): Promise<{ success: boolean, message: string }> {
    const validatedFields = SubmitReviewSchema.safeParse({
        barcode: formData.get('barcode'),
        email: formData.get('email'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid data provided. Please check the form and try again.',
        };
    }
    
    if (!admin.apps.length) {
        console.error("CRITICAL: Firebase Admin SDK is not initialized. Cannot connect to the database.");
        return {
            success: false,
            message: 'Server is not configured correctly. Please contact support.',
        };
    }

    const { barcode, email } = validatedFields.data;
    const productsRef = firestore.collection("unrecognizedProducts");

    try {
        // Query to check for an existing product with the same barcode.
        const q = productsRef.where("barcode", "==", barcode);
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
            return {
                success: true,
                message: "Thank you for your submission! This product is already in our review queue.",
            };
        }

        // No pending review found, so add the new product.
        const newProductData = {
            barcode,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewed: false,
            submittedByEmail: email || '',
        };

        await productsRef.add(newProductData);

        return {
            success: true,
            message: "Thank you for your submission! We'll review it shortly.",
        };
    } catch (error: any) {
        console.error("Error in submitReviewAction interacting with Firestore:", error);
        return {
            success: false,
            message: "A server error occurred while submitting your request. Please try again later.",
        };
    }
}
