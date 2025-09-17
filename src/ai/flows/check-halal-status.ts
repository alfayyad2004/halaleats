// src/ai/flows/check-halal-status.ts
'use server';

/**
 * @fileOverview Checks an ingredient list against a database of non-halal ingredients to determine the halal status of a product.
 *
 * - checkHalalStatus - A function that checks the halal status of a product based on its ingredients.
 * - CheckHalalStatusInput - The input type for the checkHalalStatus function.
 * - CheckHalalStatusOutput - The return type for the checkHalalStatus function.
 */

import {ai} from '@/ai/genkit';
import { nonHalalIngredients } from '@/lib/halal-data';
import { knownHalalBrands } from '@/lib/halal-brands';
import {z} from 'genkit';

const CheckHalalStatusInputSchema = z.object({
  ingredients: z.string().describe('The list of ingredients to check, separated by commas.'),
  brand: z.string().optional().describe('The brand name of the product.'),
});
export type CheckHalalStatusInput = z.infer<typeof CheckHalalStatusInputSchema>;

const CheckHalalStatusOutputSchema = z.object({
  isHalal: z.boolean().describe('Whether the product is halal or not.'),
  concerns: z.string().describe('Any potential concerns regarding the halal status.'),
});
export type CheckHalalStatusOutput = z.infer<typeof CheckHalalStatusOutputSchema>;

export async function checkHalalStatus(input: CheckHalalStatusInput): Promise<CheckHalalStatusOutput> {
  return checkHalalStatusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkHalalStatusPrompt',
  input: {schema: CheckHalalStatusInputSchema},
  output: {schema: CheckHalalStatusOutputSchema},
  prompt: `You are a halal food expert. Given the following list of ingredients, and potentially the product's brand, determine if the product is halal.

Consider these non-halal ingredients:
${nonHalalIngredients.join(', ')}

Here is a list of brands that are often known for producing halal products (though certification can vary):
${knownHalalBrands.join(', ')}

Product Brand: {{{brand}}}
Ingredients: {{{ingredients}}}

Your Task:
1. Check the ingredients against the non-halal list. If any are present, the product is not halal.
2. For ambiguous ingredients (like "flavor", "enzymes", "glycerin", "chicken flavor"), consider the brand. If the brand is on the known halal list, you can be more lenient, but should still list it as a potential concern for the user to verify. For example, you might say "Contains 'chicken flavor', which is often halal in products by this brand, but verification is recommended."
3. If the brand is not on the known list, treat ambiguous ingredients with higher suspicion.
4. If there are potential concerns (ambiguous ingredients), list them in the concerns field.
5. If the product contains explicitly non-halal ingredients, set isHalal to false and list the specific ingredients in the concerns field.
6. Return the results as JSON.`,
});

const checkHalalStatusFlow = ai.defineFlow(
  {
    name: 'checkHalalStatusFlow',
    inputSchema: CheckHalalStatusInputSchema,
    outputSchema: CheckHalalStatusOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
