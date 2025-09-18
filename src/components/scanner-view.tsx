'use client';

import { useActionState, useFormStatus } from 'react-dom';
import { Barcode, ScanLine, Camera, Text, RotateCcw, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { scanBarcodeAction } from '@/app/actions';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ScanResult, ScanError } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BrowserMultiFormatReader } from '@zxing/browser';

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
  const codeReaderRef = useRef<BrowserMultiFormatReader>(new BrowserMultiFormatReader());

  const typedState = state as ScanResult | ScanError | undefined;

  useEffect(() => {
    if (typedState) {
        if ('error' in typedState) {
            toast({
              variant: 'destructive',
              title: typedState.error,
              description: typedState.message,
            });
            setDetectedBarcode(null);
            if(scanMode === 'camera') {
                startCamera();
            }
        } else {
            onScanResponse(typedState);
        }
    }
  }, [typedState, onScanResponse, toast]);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    try {
        codeReaderRef.current.reset();
    } catch (e) {
        // It's fine if reset fails, the tracks are stopped.
    }
    setIsScanning(false);
  };
  
  const startCamera = async () => {
    if (scanMode === 'camera' && videoRef.current && !detectedBarcode) {
      try {
        setHasCameraPermission(true);
        setIsScanning(true);
        await codeReaderRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (result) {
            setDetectedBarcode(result.getText());
            stopCamera();
          }
          if (err && !(err.name === 'NotFoundException')) {
            console.error(err);
            toast({
              variant: 'destructive',
              title: 'Scan Error',
              description: 'Could not decode barcode from video stream.',
            });
            stopCamera();
          }
        });
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        setIsScanning(false);
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
        const barcodeInput = formRef.current.elements.namedItem('barcode') as HTMLInputElement;
        if (barcodeInput) {
            barcodeInput.value = detectedBarcode;
            setTimeout(() => formRef.current?.requestSubmit(), 100);
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
                {isScanning && <ScanLine className="absolute w-full h-1 text-primary/50 animate-pulse" style={{ animationDuration: '3s' }}/>}
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
              <Button type="button" variant={scanMode === 'file' ? 'default' : 'outline'} onClick={() => { setScanMode('file'); setDetectedBarcode(null); }}>
                  <Text className="mr-2" /> Manual
              </Button>
              <Button type="button" variant={scanMode === 'camera' ? 'default' : 'outline'} onClick={() => { setScanMode('camera'); setDetectedBarcode(null); }}>
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
            />
          ) : (
             <Input type="hidden" name="barcode" defaultValue={detectedBarcode || ''} />
          )}
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
        <Button type="submit" className="w-full" size="lg" disabled={!pending} style={{ display: pending ? 'inline-flex' : 'none' }}>
            {pending ? (
                <>
                    <Loader className="mr-2 animate-spin" />
                    Scanning...
                </>
            ) : 'Check Product'}
        </Button>
    );
  }
  return (
    <Button type="submit" className="w-full" size="lg" disabled={isDisabled}>
      {pending ? (
        <>
            <Loader className="mr-2 animate-spin" />
            Scanning...
        </>
      ) : 'Check Product'}
    </Button>
  );
}
