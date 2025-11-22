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

// Initialize Firebase Admin SDK only if it hasn't been already.
// This is a safe check to prevent re-initialization errors and should run once per server instance.
if (!admin.apps.length) {
    try {
        // When deployed to App Hosting, the service account credentials will be
        // automatically available in the environment via Application Default Credentials.
        admin.initializeApp();
    } catch (e) {
        console.error('CRITICAL: Firebase Admin initialization error in submit-unrecognized-product flow.', e);
    }
}

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


const submitUnrecognizedProductFlow = ai.defineFlow(
  {
    name: 'submitUnrecognizedProductFlow',
    inputSchema: SubmitUnrecognizedProductInputSchema,
    outputSchema: SubmitUnrecognizedProductOutputSchema,
  },
  async (input) => {
    const { barcode, submittedByEmail } = input;
    
    // Ensure the admin app is available. If not, it means initialization failed.
    if (!admin.apps.length) {
        // This will be caught by the action and shown to the user.
        throw new Error("Firebase Admin SDK not initialized. Cannot connect to the database. Check server logs for initialization errors.");
    }
        
    const firestore = admin.firestore();
    const productsRef = firestore.collection("unrecognizedProducts");

    try {
        // Query to check for an existing, unreviewed product with the same barcode.
        const q = productsRef.where("barcode", "==", barcode);
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
             // To avoid letting users know if a barcode exists, we can return a generic success message.
             // This prevents data leakage.
            return {
                success: true,
                message: "Thank you for your submission! If this is a new product, we'll review it shortly.",
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
        console.error("Error in submitUnrecognizedProductFlow interacting with Firestore:", error);
        // Do not expose detailed internal errors to the client.
        throw new Error("A server error occurred while writing to the database.");
    }
  }
);


export async function submitUnrecognizedProduct(input: SubmitUnrecognizedProductInput): Promise<SubmitUnrecognizedProductOutput> {
  return submitUnrecognizedProductFlow(input);
}
