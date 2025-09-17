'use server';

/**
 * @fileOverview An AI agent that detects a barcode from an image.
 *
 * - detectBarcodeFromImage - A function that handles the barcode detection process.
 * - DetectBarcodeInput - The input type for the detectBarcodeFromImage function.
 * - DetectBarcodeOutput - The return type for the detectBarcodeFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectBarcodeInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product's barcode, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectBarcodeInput = z.infer<typeof DetectBarcodeInputSchema>;

const DetectBarcodeOutputSchema = z.object({
  barcode: z.string().describe('The barcode number extracted from the image. Should be an empty string if no barcode is found.'),
});
export type DetectBarcodeOutput = z.infer<typeof DetectBarcodeOutputSchema>;

export async function detectBarcodeFromImage(input: DetectBarcodeInput): Promise<DetectBarcodeOutput> {
  return detectBarcodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'detectBarcodePrompt',
  input: {schema: DetectBarcodeInputSchema},
  output: {schema: DetectBarcodeOutputSchema},
  prompt: `You are an expert at reading barcodes from product packaging.
  
  A user has provided an image of a product. Your task is to accurately identify and transcribe the barcode number from the image.

  - Look for a standard barcode (like UPC or EAN) in the image.
  - Extract the numerical digits of the barcode.
  - Return only the numbers.
  - If you cannot find or read a barcode in the image, return an empty string for the barcode field.

  Image of product: {{media url=photoDataUri}}
  `,
});

const detectBarcodeFlow = ai.defineFlow(
  {
    name: 'detectBarcodeFlow',
    inputSchema: DetectBarcodeInputSchema,
    outputSchema: DetectBarcodeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to detect barcode from image.');
    }
    return output;
  }
);
