// src/ai/flows/submit-unrecognized-product.ts
'use server';

/**
 * @fileOverview A secure flow for submitting an unrecognized product for admin review.
 * This flow runs on the server and uses the Firebase Admin SDK to safely interact with Firestore.
 *
 * - submitUnrecognizedProduct - The function that handles the submission.
 * - SubmitUnrecognizedProductInput - The input type.
 * - SubmitUnrecognizedProductOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import * as admin from 'firebase-admin';

const SubmitUnrecognizedProductInputSchema = z.object({
  barcode: z.string().describe('The barcode of the unrecognized product.'),
  submittedByEmail: z.string().optional().describe('The email of the user submitting the product.'),
});
export type SubmitUnrecognizedProductInput = z.infer<typeof SubmitUnrecognizedProductInputSchema>;

const SubmitUnrecognizedProductOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SubmitUnrecognizedProductOutput = z.infer<typeof SubmitUnrecognizedProductOutputSchema>;


// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
    try {
        admin.initializeApp();
    } catch (e) {
        console.error('Firebase Admin initialization error', e);
    }
}


const submitUnrecognizedProductFlow = ai.defineFlow(
  {
    name: 'submitUnrecognizedProductFlow',
    inputSchema: SubmitUnrecognizedProductInputSchema,
    outputSchema: SubmitUnrecognizedProductOutputSchema,
  },
  async (input) => {
    const { barcode, submittedByEmail } = input;
    
    try {
        const firestore = admin.firestore();
        const productsRef = firestore.collection("unrecognizedProducts");

        // Query to check for an existing, unreviewed product with the same barcode.
        const q = productsRef.where("barcode", "==", barcode).where("reviewed", "==", false);
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
            return {
                success: true, // It's not a failure, just a duplicate.
                message: 'This product has already been submitted for review. Thank you!',
            };
        }

        // No pending review found, so add the new product.
        const newProductData = {
            barcode,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewed: false,
            submittedByEmail: submittedByEmail || '',
        };

        await productsRef.add(newProductData);

        return {
            success: true,
            message: "Thank you for your submission! We'll review it shortly.",
        };
    } catch (error: any) {
        console.error("Error in submitUnrecognizedProductFlow:", error);
        // Do not expose detailed internal errors to the client.
        throw new Error("A server error occurred while submitting the product.");
    }
  }
);


export async function submitUnrecognizedProduct(input: SubmitUnrecognizedProductInput): Promise<SubmitUnrecognizedProductOutput> {
  return submitUnrecognizedProductFlow(input);
}
