import { z } from 'zod';

export const BarcodeSchema = z.object({
  barcode: z.string().min(1, { message: 'Barcode cannot be empty.' }),
});
