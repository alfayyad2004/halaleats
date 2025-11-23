'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UnrecognizedProduct } from '@/lib/types';
import { classifyProduct } from '@/firebase/firestore/mutations';
import { Loader } from 'lucide-react';
import { useFirestore } from '@/firebase';

interface ClassifyProductDialogProps {
  product: UnrecognizedProduct;
}

const formSchema = z.object({
  productName: z.string().min(1, 'Product name is required.'),
  ingredients: z.string().min(1, 'Ingredients are required.'),
});

export function ClassifyProductDialog({ product }: ClassifyProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: product.productName || '',
      ingredients: product.ingredients || '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      await classifyProduct(firestore, product.id, values.productName, values.ingredients);
      toast({
        title: 'Product Classified',
        description: `${values.productName} has been updated.`,
      });
      setOpen(false);
    } catch (error: any) {
      // The FirestorePermissionError will be thrown by the listener in dev,
      // so we only need to show a generic toast here for production.
      if (error.name !== 'FirestorePermissionError') {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to classify product. You may not have the required permissions.',
        });
      }
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={product.reviewed ? "secondary" : "default"} size="sm">
            {product.reviewed ? 'Reviewed' : 'Classify'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Classify Product</DialogTitle>
          <DialogDescription>
            Enter the correct details for barcode:{' '}
            <span className="font-mono font-bold">{product.barcode}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Original Fried Noodles" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredients</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Wheat Flour, Palm Oil, Salt..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost" disabled={isSubmitting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader className="mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
