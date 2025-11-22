'use server';

import { checkHalalStatus, CheckHalalStatusOutput } from '@/ai/flows/check-halal-status';
import { fetchIngredientList } from '@/ai/flows/fetch-ingredient-list';
import { extractIngredientsFromImage } from '@/ai/flows/extract-ingredients-from-image';
import { getProductName } from '@/services/product-api';
import { BarcodeSchema } from '@/app/schema';
import { z } from 'zod';
import { addUnrecognizedProduct, classifyProduct } from '@/firebase/firestore/mutations';

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
        // Return a specific error to let the UI handle submission
        return {
            error: 'Product Not Found',
            message: "We couldn't find a product with that barcode. Would you like to submit it for review?",
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

    const halalStatus = await checkHalalStatus({ ingredients, brand: productName });

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
    const productName = barcode ? await getProductName(barcode) : 'Scanned Product';
    const halalStatus = await checkHalalStatus({ 
        ingredients, 
        brand: productName !== 'Product not found.' ? productName : undefined 
    });
    

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

const SubmitReviewSchema = z.object({
  barcode: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
});

export async function submitReviewAction(prevState: any, formData: FormData): Promise<{ success: boolean, message: string }> {
  const validatedFields = SubmitReviewSchema.safeParse({
    barcode: formData.get('barcode'),
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: validatedFields.error.flatten().fieldErrors.email?.join(', ') || 'Invalid data.',
    };
  }

  const { barcode, email } = validatedFields.data;
  
  try {
    const result = await addUnrecognizedProduct(barcode, email);
    return result;
  } catch(e) {
    console.error(e);
    return {
      success: false,
      message: "There was an error submitting your review. Please try again.",
    }
  }
}

const ClassifyProductSchema = z.object({
    id: z.string().min(1),
    productName: z.string().min(1, 'Product name is required.'),
    ingredients: z.string().min(1, 'Ingredients are required.'),
});

export async function classifyProductAction(prevState: any, formData: FormData) {
    const validatedFields = ClassifyProductSchema.safeParse({
        id: formData.get('id'),
        productName: formData.get('productName'),
        ingredients: formData.get('ingredients'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid data provided.',
        };
    }

    const { id, productName, ingredients } = validatedFields.data;

    try {
        await classifyProduct(id, productName, ingredients);
        return {
            success: true,
            message: 'Product has been classified successfully!',
        };
    } catch (e: any) {
        console.error(e);
        return {
            success: false,
            message: e.message || 'An error occurred while classifying the product.',
        };
    }
}
