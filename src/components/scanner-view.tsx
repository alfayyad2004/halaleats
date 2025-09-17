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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { detectBarcodeFromImage } from '@/ai/flows/detect-barcode-from-image';

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
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
            if(scanMode === 'camera') {
                startCamera(); // Restart camera scanning if it was in camera mode
            }
        }
        onScanResponse(typedState);
    }
  }, [typedState, onScanResponse, toast]);

  const stopCamera = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const captureFrameAndDetectBarcode = async () => {
    if (videoRef.current && videoRef.current.readyState === 4 && !detectedBarcode) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        
        try {
          setIsScanning(true);
          const { barcode } = await detectBarcodeFromImage({ photoDataUri: dataUri });
          if (barcode) {
            setDetectedBarcode(barcode);
            stopCamera();
          }
        } catch (error) {
          console.error("Error detecting barcode:", error);
        } finally {
          setIsScanning(false);
        }
      }
    }
  };
  
  const startCamera = async () => {
    if (scanMode === 'camera' && videoRef.current && !detectedBarcode) {
      try {
        stopCamera(); 
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            captureIntervalRef.current = setInterval(captureFrameAndDetectBarcode, 1000);
          };
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

  useEffect(() => {
    if (scanMode === 'camera') {
        startCamera();
    } else {
        stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [scanMode]);

  useEffect(() => {
    if (detectedBarcode && formRef.current) {
      // The hidden input's `value` is already bound to `detectedBarcode`.
      // We just need to submit the form.
      // A small delay ensures React has updated the input value in the DOM.
      setTimeout(() => formRef.current?.requestSubmit(), 100);
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
          <SubmitButton scanMode={scanMode} isScanning={isScanning} />
          <Button onClick={() => { stopCamera(); onReset(); }} variant="ghost" className="w-full">
                <RotateCcw className="mr-2" /> Back to Selection
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SubmitButton({ scanMode, isScanning }: { scanMode: ScanMode, isScanning: boolean }) {
  const { pending } = useFormStatus();
  const isDisabled = pending || isScanning;

  if (scanMode === 'camera') {
    return (
      <Button type="submit" className="w-full" size="lg" disabled={isDisabled} style={{ display: 'none' }}>
        {pending ? 'Checking...' : 'Check Product'}
      </Button>
    );
  }
  return (
    <Button type="submit" className="w-full" size="lg" disabled={isDisabled}>
      {isDisabled ? 'Scanning...' : 'Check Product'}
    </Button>
  );
}
