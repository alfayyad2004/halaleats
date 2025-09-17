'use server';

import { checkHalalStatus, CheckHalalStatusOutput } from '@/ai/flows/check-halal-status';
import { fetchIngredientList } from '@/ai/flows/fetch-ingredient-list';
import { getProductName } from '@/services/product-api';
import { BarcodeSchema } from '@/app/schema';

export type ScanResult = {
  productName: string;
  ingredients: string;
  halalStatus: CheckHalalStatusOutput;
  barcode: string;
};

export type ScanError = {
  error: string;
  message: string;
};

export async function scanBarcodeAction(
  prevState: any,
  formData: FormData
): Promise<ScanResult | ScanError> {
  const validatedFields = BarcodeSchema.safeParse({
    barcode: formData.get('barcode'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Validation Error',
      message: validatedFields.error.flatten().fieldErrors.barcode?.join(', ') || 'Invalid barcode.',
    };
  }

  const { barcode } = validatedFields.data;

  try {
    const productName = await getProductName(barcode);
    if (productName === 'Product not found.') {
        return {
            error: 'Product Not Found',
            message: "We couldn't find a product with that barcode. Please try a different one."
        }
    }

    const { ingredients } = await fetchIngredientList({ barcode });
    if (ingredients.includes('not found')) {
      return {
        error: 'Ingredients Not Found',
        message: "We found the product, but couldn't retrieve its ingredients.",
      };
    }

    const halalStatus = await checkHalalStatus({ ingredients });

    return {
      productName,
      ingredients,
      halalStatus,
      barcode
    };
  } catch (e) {
    console.error(e);
    return {
      error: 'Server Error',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }
}
