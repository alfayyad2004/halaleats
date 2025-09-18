'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Barcode, ScanText, CheckCircle2, PackageCheck } from 'lucide-react';
import { HalalEatsLogo } from './halal-eats-logo';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface TutorialViewProps {
  onFinish: () => void;
}

export function TutorialView({ onFinish }: TutorialViewProps) {
  const tutorialSteps = [
    {
      icon: <HalalEatsLogo className="w-32 h-auto" />,
      title: 'Welcome to HalalEats!',
      description: 'Your smart guide to Halal food choices. Let\'s walk you through how it works.',
    },
    {
      icon: <Barcode className="w-16 h-16 text-primary" />,
      title: 'Scan Barcodes',
      description: 'Instantly check a product\'s status by scanning its barcode. The app will fetch its name and ingredients for you.',
    },
    {
      icon: <ScanText className="w-16 h-16 text-primary" />,
      title: 'Scan Ingredients',
      description: 'No barcode? No problem! Just take a clear photo of the ingredient list, and our AI will analyze it.',
    },
    {
      icon: <PackageCheck className="w-16 h-16 text-primary" />,
      title: 'Get Instant Results',
      description: 'Receive a clear Halal, Not Halal, or Doubtful status, along with any ingredients of concern.',
    },
  ];

  return (
    <Dialog open={true} onOpenChange={(isOpen) => { if (!isOpen) onFinish(); }}>
        <DialogContent className="sm:max-w-[425px] p-0 border-0" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
            <Carousel className="w-full">
            <CarouselContent>
                {tutorialSteps.map((step, index) => (
                <CarouselItem key={index}>
                    <div className="p-1">
                    <Card className="border-0 shadow-none">
                        <CardHeader className="items-center text-center pt-10 pb-6">
                            {step.icon}
                            <CardTitle className="font-headline text-2xl mt-4">{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center text-muted-foreground min-h-[80px] px-8">
                            <p>{step.description}</p>
                        </CardContent>
                        <CardFooter className="flex-col gap-4 px-8 pb-10">
                            {index === tutorialSteps.length - 1 ? (
                                <Button size="lg" className="w-full" onClick={onFinish}>
                                    <CheckCircle2 className="mr-2"/> Get Started
                                </Button>
                            ) : (
                                <CarouselNext className="w-full static translate-x-0" />
                            )}
                             <div className="h-8">
                                {index < tutorialSteps.length - 1 && <CarouselPrevious className="static translate-x-0" />}
                            </div>
                        </CardFooter>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            </Carousel>
        </DialogContent>
    </Dialog>
  );
}