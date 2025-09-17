import { config } from 'dotenv';
config();

import '@/ai/flows/fetch-ingredient-list.ts';
import '@/ai/flows/identify-product-from-barcode.ts';
import '@/ai/flows/check-halal-status.ts';
import '@/ai/flows/extract-ingredients-from-image.ts';
import '@/ai/flows/detect-barcode-from-image.ts';
