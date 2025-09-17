'use server';

import { checkHalalStatus, CheckHalalStatusOutput } from '@/ai/flows/check-halal-status';
import { fetchIngredientList } from '@/ai/flows/fetch-ingredient-list';
import { extractIngredientsFromImage } from '@/ai/flows/extract-ingredients-from-image';
import { getProductName } from '@/services/product-api';
import { BarcodeSchema } from '@/app/schema';
import { z } from 'zod';

export type ScanResult = {
  productName: string;
  ingredients: string;
  halalStatus: CheckHalalStatusOutput;
  barcode: string;
};

export type ScanError = {
  error: string;
  message: string;
  barcode?: string;
};

const ImageScanSchema = z.object({
  photoDataUri: z.string().min(1, { message: 'Image data cannot be empty.' }),
  barcode: z.string().optional(),
});

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
            message: "We couldn't find a product with that barcode. Please try a different one.",
            barcode: barcode,
        }
    }

    const { ingredients } = await fetchIngredientList({ barcode });
    if (ingredients.includes('not found')) {
      return {
        error: 'Ingredients Not Found',
        message: "We found the product, but couldn't retrieve its ingredients.",
        barcode: barcode
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

export async function scanIngredientsAction(
  prevState: any,
  formData: FormData
): Promise<ScanResult | ScanError> {
  const validatedFields = ImageScanSchema.safeParse({
    photoDataUri: formData.get('photoDataUri'),
    barcode: formData.get('barcode'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Validation Error',
      message: 'Invalid image data.',
    };
  }

  const { photoDataUri, barcode } = validatedFields.data;

  try {
    const { ingredients } = await extractIngredientsFromImage({ photoDataUri });
    const halalStatus = await checkHalalStatus({ ingredients });
    const productName = barcode ? await getProductName(barcode) : 'Scanned Product';

    return {
      productName: productName !== 'Product not found.' ? productName : 'Scanned Product',
      ingredients,
      halalStatus,
      barcode: barcode || 'N/A',
    };
  } catch (e) {
    console.error(e);
    return {
      error: 'Server Error',
      message: 'An unexpected error occurred while analyzing the image. Please try again.',
    };
  }
}
