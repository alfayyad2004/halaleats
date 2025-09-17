'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Barcode, ScanLine, Camera, Text, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { scanBarcodeAction } from '@/app/actions';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ScanResult, ScanError } from '@/app/actions';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ScannerViewProps {
  onScanResponse: (result: ScanResult | ScanError) => void;
  onReset: () => void;
}

const initialState = undefined;

type ScanMode = 'file' | 'camera';

export function ScannerView({ onScanResponse, onReset }: ScannerViewProps) {
  const [state, formAction] = useActionState(scanBarcodeAction, initialState);
  const { toast } = useToast();
  const [scanMode, setScanMode] = useState<ScanMode>('file');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const typedState = state as ScanResult | ScanError | undefined;

  useEffect(() => {
    if (typedState) {
        if ('error' in typedState) {
            toast({
              variant: 'destructive',
              title: typedState.error,
              description: typedState.message,
            });
            setDetectedBarcode(null); // Reset barcode on error
        }
        onScanResponse(typedState);
    }
  }, [typedState, onScanResponse, toast]);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      if (scanMode === 'camera' && videoRef.current) {
        try {
          // Stop any existing camera streams
          if (controlsRef.current) {
            controlsRef.current.stop();
          }
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            const controls = await codeReader.decodeFromStream(stream, videoRef.current, (result, err) => {
              if (result && !detectedBarcode) { // Only set if not already processing a barcode
                setDetectedBarcode(result.getText());
              }
            });
            controlsRef.current = controls;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      }
    };

    startCamera();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [scanMode, toast, detectedBarcode]);

  useEffect(() => {
    if (detectedBarcode && formRef.current) {
      const barcodeInput = formRef.current.elements.namedItem('barcode') as HTMLInputElement;
      if (barcodeInput) {
        barcodeInput.value = detectedBarcode;
      }
      // Automatically submit the form
      if (formRef.current) {
          formRef.current.requestSubmit();
      }
    }
  }, [detectedBarcode]);


  return (
    <Card className="overflow-hidden shadow-lg">
      <form action={formAction} ref={formRef}>
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Scan Barcode</CardTitle>
          <CardDescription>
            {scanMode === 'file'
              ? 'Enter a product barcode below to check its Halal status.'
              : 'Point your camera at a barcode.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative flex justify-center items-center aspect-video w-full rounded-lg bg-secondary/30 overflow-hidden border-2 border-dashed border-primary/30 p-4">
            {scanMode === 'camera' ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <ScanLine className="absolute w-full h-1 text-primary/50 animate-pulse" style={{ animationDuration: '3s' }}/>
                {hasCameraPermission === false && (
                    <Alert variant="destructive" className="absolute">
                        <AlertTitle>Camera Access Required</AlertTitle>
                        <AlertDescription>
                        Please allow camera access in your browser settings.
                        </AlertDescription>
                    </Alert>
                )}
              </>
            ) : (
                <>
                    <ScanLine className="absolute w-full h-1 text-primary/50 animate-pulse" style={{ animationDuration: '3s' }}/>
                    <Barcode className="w-24 h-24 text-primary/20"/>
                </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={scanMode === 'file' ? 'default' : 'outline'} onClick={() => { setScanMode('file'); setDetectedBarcode(null); }}>
                  <Text className="mr-2" /> Manual
              </Button>
              <Button type="button" variant={scanMode === 'camera' ? 'default' : 'outline'} onClick={() => { setScanMode('camera'); setDetectedBarcode(null); }}>
                  <Camera className="mr-2" /> Camera
              </Button>
          </div>

          {scanMode === 'file' && (
            <Input
              name="barcode"
              placeholder="e.g., 8992761134010"
              className="text-center text-lg h-12"
              aria-label="Barcode Input"
              required
              defaultValue={detectedBarcode || ''}
            />
          )}
           {/* Hidden input to carry the barcode value for both modes */}
           <Input type="hidden" name="barcode" value={detectedBarcode || ''} />
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <SubmitButton scanMode={scanMode} />
          <Button onClick={onReset} variant="ghost" className="w-full">
                <RotateCcw className="mr-2" /> Back to Selection
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SubmitButton({ scanMode }: { scanMode: ScanMode }) {
  const { pending } = useFormStatus();
  if (scanMode === 'camera') {
    return (
      <Button type="submit" className="w-full" size="lg" disabled={pending} style={{ display: 'none' }}>
        {pending ? 'Scanning...' : 'Check Product'}
      </Button>
    );
  }
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? 'Scanning...' : 'Check Product'}
    </Button>
  );
}
