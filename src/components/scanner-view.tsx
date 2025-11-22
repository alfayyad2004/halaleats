'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Barcode, ScanLine, Camera, Text, RotateCcw, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { scanBarcodeAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import type { ScanResult, ScanError } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BrowserMultiFormatReader, BarcodeFormat } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import type { IBrowserCodeReader } from '@zxing/browser';


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
  const codeReaderRef = useRef<IBrowserCodeReader | null>(null);

  const typedState = state as ScanResult | ScanError | undefined;

  // Initialize the code reader once.
  useEffect(() => {
    if (!codeReaderRef.current) {
        const hints = new Map();
        const formats = [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE];
        hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
        codeReaderRef.current = new BrowserMultiFormatReader(hints, 500);
    }
  }, []);

  useEffect(() => {
    if (typedState) {
        if ('error' in typedState && typedState.error !== 'Product Not Found') {
            toast({
              variant: 'destructive',
              title: typedState.error,
              description: typedState.message,
            });
            // Reset barcode to allow for a new scan attempt after error
            setDetectedBarcode(null);
        } else {
            onScanResponse(typedState);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedState, toast]);
  
  const stopCamera = () => {
    if (codeReaderRef.current) {
        codeReaderRef.current.reset();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const codeReader = codeReaderRef.current;
    if (scanMode === 'camera' && codeReader && !detectedBarcode) {
      const startScan = async () => {
        try {
          // Request camera permission and stream
          await codeReader.getVideoInputDevices();
          setHasCameraPermission(true);
          if (videoRef.current) {
             codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                if (result && !detectedBarcode) {
                  setDetectedBarcode(result.getText());
                  stopCamera();
                }
                if (err && !(err.name === 'NotFoundException')) {
                   console.error('Barcode scan error:', err);
                }
              });
          }
        } catch (error) {
           console.error('Camera access error:', error);
           setHasCameraPermission(false);
           toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      };

      startScan();

      return () => {
        stopCamera();
      };
    } else {
        stopCamera();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanMode, toast, detectedBarcode]);


  useEffect(() => {
    if (detectedBarcode && formRef.current) {
        const barcodeInput = formRef.current.elements.namedItem('barcode') as HTMLInputElement;
        if (barcodeInput) {
            barcodeInput.value = detectedBarcode;
            const isPending = formRef.current.hasAttribute('data-pending');
            if (!isPending) {
              setTimeout(() => formRef.current?.requestSubmit(), 100);
            }
        }
    }
  }, [detectedBarcode]);

  const handleModeChange = (mode: ScanMode) => {
    setDetectedBarcode(null);
    setScanMode(mode);
  }

  const handleResetClick = () => {
    onReset();
  }

  const { pending } = useFormStatus();
  useEffect(() => {
    if (formRef.current) {
      if (pending) {
        formRef.current.setAttribute('data-pending', 'true');
      } else {
        formRef.current.removeAttribute('data-pending');
      }
    }
  }, [pending]);

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
                {!detectedBarcode && <ScanLine className="absolute w-full h-1 text-primary/50 animate-pulse" style={{ animationDuration: '3s' }}/>}
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
                    <Barcode className="w-24 h-24 text-primary/20"/>
                </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={scanMode === 'file' ? 'default' : 'outline'} onClick={() => handleModeChange('file')}>
                  <Text className="mr-2" /> Manual
              </Button>
              <Button type="button" variant={scanMode === 'camera' ? 'default' : 'outline'} onClick={() => handleModeChange('camera')}>
                  <Camera className="mr-2" /> Camera
              </Button>
          </div>

          {scanMode === 'file' ? (
            <Input
              name="barcode"
              placeholder="e.g., 8992761134010"
              className="text-center text-lg h-12"
              aria-label="Barcode Input"
              required
              disabled={detectedBarcode !== null}
            />
          ) : (
             <Input type="hidden" name="barcode" defaultValue={detectedBarcode || ''} />
          )}
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <SubmitButton scanMode={scanMode} />
          <Button onClick={handleResetClick} variant="ghost" className="w-full">
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
    // In camera mode, we only show the loading state, as submission is automatic.
    return pending ? (
        <Button type="submit" className="w-full" size="lg" disabled>
            <Loader className="mr-2 animate-spin" />
            Checking...
        </Button>
    ) : null;
  }
  
  // In manual mode, we show a submittable button.
  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending}>
      {pending ? (
        <>
            <Loader className="mr-2 animate-spin" />
            Checking...
        </>
      ) : 'Check Product'}
    </Button>
  );
}
