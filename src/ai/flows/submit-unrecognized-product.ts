'use server';

/**
 * @fileOverview Handles the submission of unrecognized products for admin review.
 *
 * - submitUnrecognizedProduct - A flow that adds a new product to the review queue if it's not already there.
 * - SubmitUnrecognizedProductInput - The input type for the flow.
 * - SubmitUnrecognizedProductOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase-admin/firestore';
import { getFirestore } from 'firebase-admin/firestore';

const SubmitUnrecognizedProductInputSchema = z.object({
  barcode: z.string().describe('The barcode of the unrecognized product.'),
  email: z.string().email().optional().describe('The email of the user submitting the product for notification.'),
});
export type SubmitUnrecognizedProductInput = z.infer<typeof SubmitUnrecognizedProductInputSchema>;

const SubmitUnrecognizedProductOutputSchema = z.object({
  success: z.boolean().describe('Whether the submission was successful.'),
  message: z.string().describe('A message indicating the result of the submission.'),
});
export type SubmitUnrecognizedProductOutput = z.infer<typeof SubmitUnrecognizedProductOutputSchema>;


export async function submitUnrecognizedProduct(input: SubmitUnrecognizedProductInput): Promise<SubmitUnrecognizedProductOutput> {
    return submitUnrecognizedProductFlow(input);
}


const submitUnrecognizedProductFlow = ai.defineFlow(
  {
    name: 'submitUnrecognizedProductFlow',
    inputSchema: SubmitUnrecognizedProductInputSchema,
    outputSchema: SubmitUnrecognizedProductOutputSchema,
  },
  async ({ barcode, email }) => {
    // This flow runs on the server with admin privileges, so it can safely query the database.
    const db = getFirestore();
    const productsRef = collection(db, 'unrecognizedProducts');
    
    // Check if a product with the same barcode is already pending review.
    const q = query(productsRef, where('barcode', '==', barcode), where('reviewed', '==', false));
    
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        return {
            success: true, // It's not a failure, the user just doesn't need to submit again.
            message: 'This product has already been submitted for review. Thank you!',
        };
    }

    // Add the new product to the collection.
    const newProductData = {
        barcode,
        createdAt: serverTimestamp(),
        reviewed: false,
        submittedByEmail: email || '', // Ensure the field exists even if empty
    };

    await addDoc(productsRef, newProductData);

    return {
        success: true,
        message: "Thank you for your submission! We'll review it shortly.",
    };
  }
);
