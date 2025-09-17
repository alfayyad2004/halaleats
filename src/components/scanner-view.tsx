'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Barcode, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { scanBarcodeAction } from '@/app/actions';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ScanResult, ScanError } from '@/app/actions';

interface ScannerViewProps {
  onScanSuccess: (result: ScanResult) => void;
}

const initialState = undefined;

export function ScannerView({ onScanSuccess }: ScannerViewProps) {
  const [state, formAction] = useFormState(scanBarcodeAction, initialState);
  const { toast } = useToast();
  
  const typedState = state as ScanResult | ScanError | undefined;

  useEffect(() => {
    if (typedState) {
      if ('error' in typedState) {
        toast({
          variant: 'destructive',
          title: typedState.error,
          description: typedState.message,
        });
      } else {
        onScanSuccess(typedState);
      }
    }
  }, [state, onScanSuccess, toast]);

  return (
    <div className="w-full max-w-md">
      <Card className="overflow-hidden shadow-lg">
        <form action={formAction}>
          <CardHeader className="text-center">
            <CardTitle className="font-headline text-2xl">Ready to Scan</CardTitle>
            <CardDescription>Enter a product barcode below to check its Halal status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative flex justify-center items-center aspect-video w-full rounded-lg bg-secondary/30 overflow-hidden border-2 border-dashed border-primary/30 p-4">
              <ScanLine className="absolute w-full h-1 text-primary/50 animate-pulse" style={{ animationDuration: '3s' }}/>
              <Barcode className="w-24 h-24 text-primary/20"/>
            </div>
            <Input
              name="barcode"
              placeholder="e.g., 8992761134010"
              className="text-center text-lg h-12"
              aria-label="Barcode Input"
              required
            />
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Scanning...' : 'Check Product'}
    </Button>
  );
}
