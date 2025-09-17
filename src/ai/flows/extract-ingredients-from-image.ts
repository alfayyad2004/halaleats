'use server';

/**
 * @fileOverview An AI agent that extracts ingredients from an image of a product's ingredient list.
 *
 * - extractIngredientsFromImage - A function that handles the ingredient extraction process.
 * - ExtractIngredientsInput - The input type for the extractIngredientsFromImage function.
 * - ExtractIngredientsOutput - The return type for the extractIngredientsFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractIngredientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product's ingredient list, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractIngredientsInput = z.infer<typeof ExtractIngredientsInputSchema>;

const ExtractIngredientsOutputSchema = z.object({
  ingredients: z.string().describe('The comma-separated list of ingredients extracted from the image.'),
});
export type ExtractIngredientsOutput = z.infer<typeof ExtractIngredientsOutputSchema>;

export async function extractIngredientsFromImage(input: ExtractIngredientsInput): Promise<ExtractIngredientsOutput> {
  return extractIngredientsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractIngredientsPrompt',
  input: {schema: ExtractIngredientsInputSchema},
  output: {schema: ExtractIngredientsOutputSchema},
  prompt: `You are an expert at reading ingredient lists from product packaging.
  
  A user has provided an image of an ingredient list. Your task is to accurately transcribe all the ingredients shown in the image.

  - Transcribe the ingredients exactly as they appear.
  - Pay attention to details like parentheses and sub-ingredients.
  - Format the output as a single, comma-separated string.
  - If you cannot read the ingredients from the image, return an empty string for the ingredients field.

  Image of ingredient list: {{media url=photoDataUri}}
  `,
});

const extractIngredientsFlow = ai.defineFlow(
  {
    name: 'extractIngredientsFlow',
    inputSchema: ExtractIngredientsInputSchema,
    outputSchema: ExtractIngredientsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to extract ingredients from image.');
    }
    return output;
  }
);
