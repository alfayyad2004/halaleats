
'use server';

import { CheckHalalStatusOutput, checkHalalStatus } from '@/ai/flows/check-halal-status';
import { fetchIngredientList } from '@/ai/flows/fetch-ingredient-list';
import { extractIngredientsFromImage } from '@/ai/flows/extract-ingredients-from-image';
import { getProductName } from '@/services/product-api';
import { BarcodeSchema } from '@/app/schema';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// This function ensures Firebase Admin is initialized and returns the Firestore instance.
function getFirestoreAdmin() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp();
    } catch (e) {
      console.error('CRITICAL: Firebase Admin initialization error in actions.ts.', e);
      // This will cause the action to fail, which is the desired behavior
      // if the admin SDK can't be initialized.
      throw new Error('Server configuration error.');
    }
  }
  return admin.firestore();
}


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
    const firestore = getFirestoreAdmin();

    const validatedFields = SubmitReviewSchema.safeParse({
        barcode: formData.get('barcode'),
        email: formData.get('email'),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: 'Invalid data provided. Please check the form and try again.',
        };
    }

    const { barcode, email } = validatedFields.data;
    const productsRef = firestore.collection("unrecognizedProducts");

    try {
        const q = productsRef.where("barcode", "==", barcode);
        const querySnapshot = await q.get();

        if (!querySnapshot.empty) {
            return {
                success: true,
                message: "Thank you for your submission! This product is already in our review queue.",
            };
        }

        const newProductData = {
            barcode,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewed: false,
            submittedByEmail: email || '',
        };

        await productsRef.add(newProductData);

        return {
            success: true,
            message: "Thank you for your submission! We'll review it shortly.",
        };

    } catch (error: any) {
        console.error("Error in submitReviewAction interacting with Firestore:", error);
        return {
            success: false,
            message: 'The server is not configured correctly.',
        };
    }
}


const ClassifyProductSchema = z.object({
    id: z.string().min(1),
    productName: z.string().min(1, 'Product name is required.'),
    ingredients: z.string().min(1, 'Ingredients are required.'),
});

export async function classifyProductAction(prevState: any, formData: FormData) {
    const firestore = getFirestoreAdmin();
    
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
    const productRef = firestore.collection('unrecognizedProducts').doc(id);

    try {
        await productRef.update({
            productName,
            ingredients,
            reviewed: true,
        });
        return {
            success: true,
            message: 'Product has been classified successfully!',
        };
    } catch (e: any) {
        console.error("Error in classifyProductAction:", e);
        return {
            success: false,
            message: 'The server is not configured correctly.',
        };
    }
}
