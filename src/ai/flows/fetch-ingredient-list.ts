'use server';

/**
 * @fileOverview Fetches the ingredient list of a product from a third-party API.
 *
 * - fetchIngredientList - A function that handles fetching the ingredient list.
 * - FetchIngredientListInput - The input type for the fetchIngredientList function.
 * - FetchIngredientListOutput - The return type for the fetchIngredientList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getProductIngredients } from '@/services/product-api';

const FetchIngredientListInputSchema = z.object({
  barcode: z.string().describe('The barcode of the product.'),
});
export type FetchIngredientListInput = z.infer<typeof FetchIngredientListInputSchema>;

const FetchIngredientListOutputSchema = z.object({
  ingredients: z.string().describe('The list of ingredients for the product.'),
});
export type FetchIngredientListOutput = z.infer<typeof FetchIngredientListOutputSchema>;

export async function fetchIngredientList(input: FetchIngredientListInput): Promise<FetchIngredientListOutput> {
  const ingredients = await getProductIngredients(input.barcode);
  return {
    ingredients,
  };
}
