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
import {z} from 'genkit';

const CheckHalalStatusInputSchema = z.object({
  ingredients: z.string().describe('The list of ingredients to check, separated by commas.'),
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
  prompt: `You are a halal food expert. Given the following list of ingredients, determine if the product is halal.

Consider these non-halal ingredients:
${nonHalalIngredients.join(', ')}

Ingredients: {{{ingredients}}}

If any of the ingredients are non-halal, the product is not halal. If there are potential concerns, list them in the concerns field. Return the results as JSON.`, // eslint-disable-line max-len
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
