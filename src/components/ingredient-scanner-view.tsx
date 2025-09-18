'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Camera, Image, Upload, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { scanIngredientsAction } from '@/app/actions';
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ScanResult, ScanError } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface IngredientScannerViewProps {
  onScanSuccess: (result: ScanResult) => void;
  onReset: () => void;
  barcode?: string | null;
}

const initialState = undefined;

export function IngredientScannerView({ onScanSuccess, onReset, barcode }: IngredientScannerViewProps) {
  const [state, formAction] = useActionState(scanIngredientsAction, initialState);
  const { toast } = useToast();
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
  }, [typedState, onScanSuccess, toast]);

  const getCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
  };

  const handleUseCamera = () => {
    setPhotoDataUri(null); // Clear previous photo
    setIsCameraActive(true);
    getCameraPermission();
  };
  
  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setPhotoDataUri(dataUri);
        setIsCameraActive(false); // Turn off camera view
      }
      if (video.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoDataUri(e.target?.result as string);
        setIsCameraActive(false);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleBack = () => {
    if (isCameraActive) {
      setIsCameraActive(false);
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    } else {
      onReset();
    }
  };

  useEffect(() => {
    if (photoDataUri && formRef.current) {
      // Small delay to ensure the hidden input is updated before submitting
      setTimeout(() => formRef.current?.requestSubmit(), 100);
    }
  }, [photoDataUri]);

  return (
    <Card className="overflow-hidden shadow-lg">
      <form action={formAction} ref={formRef}>
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">Scan Ingredients</CardTitle>
          <CardDescription>Take or upload a photo of the ingredient list.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative flex justify-center items-center aspect-video w-full rounded-lg bg-secondary/30 overflow-hidden border-2 border-dashed border-primary/30 p-4">
            {photoDataUri ? (
              <img src={photoDataUri} alt="Ingredient list preview" className="w-full h-full object-contain" />
            ) : isCameraActive ? (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            ) : (
              <Image className="w-24 h-24 text-primary/20" />
            )}
            {isCameraActive && hasCameraPermission === false && (
                <Alert variant="destructive" className="absolute">
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>Please allow camera access.</AlertDescription>
                </Alert>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden"></canvas>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />
          <input type="hidden" name="photoDataUri" value={photoDataUri || ''} />
          <input type="hidden" name="barcode" value={barcode || ''} />

          {isCameraActive ? (
              <Button type="button" className="w-full" onClick={takePicture}>
                  <Camera className="mr-2" /> Take Picture
              </Button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={handleUseCamera}>
                    <Camera className="mr-2" /> Use Camera
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2" /> Upload Photo
                </Button>
            </div>
          )}

           <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Tip</AlertTitle>
                <AlertDescription>
                    For best results, ensure the ingredient list is clear, well-lit, and fills the frame.
                </AlertDescription>
            </Alert>
        </CardContent>
        <CardFooter className="flex-col gap-2">
            <SubmitButton photoDataUri={photoDataUri} />
            <Button onClick={handleBack} variant="ghost" className="w-full">
                <RotateCcw className="mr-2" /> {isCameraActive ? 'Back to Options' : 'Back to Selection'}
            </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function SubmitButton({ photoDataUri }: { photoDataUri: string | null }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" size="lg" disabled={pending || !photoDataUri}>
      {pending ? 'Analyzing...' : 'Check Ingredients'}
    </Button>
  );
}
