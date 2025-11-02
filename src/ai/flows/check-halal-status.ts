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
  prompt: `You are a halal food and pharmaceutical expert. Given the following list of ingredients, and potentially the product's brand, determine if the product is halal.

Consider these non-halal or doubtful ingredients:
${nonHalalIngredients.join(', ')}

Here is a list of brands that are often known for producing halal products (though certification can vary):
${knownHalalBrands.join(', ')}

Product Brand: {{{brand}}}
Ingredients: {{{ingredients}}}

Your Task:
1.  Check the ingredients against the non-halal/doubtful list. If any explicitly haram ingredients (like pork, alcohol) are present, the product is not halal.
2.  For ambiguous ingredients (like "glycerin", "enzymes", "magnesium stearate", "gelatin"), the source is critical. If the source is not specified as plant-based or from a halal animal source, treat it as a concern.
3.  When analyzing medications or vitamins, pay special attention to the source of gelatin (used in capsules), glycerin, magnesium stearate, and any coatings (like shellac/pharmaceutical glaze). These are very often from non-halal sources.
4.  Consider the brand. If the brand is on the known halal list, you can be more lenient on ambiguous items, but should still list it as a potential concern for the user to verify. For example: "Contains 'gelatin', which is often from a halal source in products by this brand, but verification is recommended."
5.  If the brand is not on the known list, treat ambiguous ingredients with higher suspicion.
6.  If there are potential concerns (ambiguous ingredients), set isHalal to true but list them clearly in the concerns field.
7.  If the product contains explicitly non-halal ingredients, set isHalal to false and list the specific ingredients in the concerns field.
8.  Return the results as JSON.`,
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
