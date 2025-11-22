'use client';

import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Send, Loader, RotateCcw } from 'lucide-react';
import { submitReviewAction } from '@/app/actions/submit-unrecognized-product';
import { useToast } from '@/hooks/use-toast';

interface SubmitReviewViewProps {
  barcode: string;
  onSubmitted: () => void;
  onReset: () => void;
}

const initialState = { success: false, message: '' };

export function SubmitReviewView({ barcode, onSubmitted, onReset }: SubmitReviewViewProps) {
  const [state, formAction] = useActionState(submitReviewAction, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: 'Submission Successful',
          description: state.message,
        });
        // Delay navigation to allow user to see the toast
        setTimeout(onSubmitted, 1500);
      } else {
        toast({
          variant: 'destructive',
          title: 'Submission Failed',
          description: state.message,
        });
      }
    }
  }, [state, onSubmitted, toast]);

  return (
    <Card className="shadow-lg">
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Product Not Found</CardTitle>
          <CardDescription>
            The barcode <span className="font-mono font-bold">{barcode}</span> was not found in our database. You can submit it for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <input type="hidden" name="barcode" value={barcode} />
            <div className="space-y-2">
                <Label htmlFor="email">Email (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                    We can notify you when this product has been reviewed.
                </p>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" name="email" type="email" placeholder="you@example.com" className="pl-10" />
                </div>
            </div>
        </CardContent>
        <CardFooter className="flex-col gap-2">
            <SubmitButton />
            <Button type="button" variant="ghost" onClick={onReset} className="w-full">
                <RotateCcw className="mr-2" /> Cancel
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}


function SubmitButton() {
    const { pending } = useFormStatus();
  
    return (
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Loader className="mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2" />
            Submit for Review
          </>
        )}
      </Button>
    );
  }
