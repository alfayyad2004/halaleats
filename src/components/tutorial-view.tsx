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
    <Dialog open={true}>
        <DialogContent className="sm:max-w-[425px] p-0 border-0" onPointerDownOutside={(e) => e.preventDefault()}>
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
                        </CardFooter>
                    </Card>
                    </div>
                </CarouselItem>
                ))}
            </CarouselContent>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <CarouselPrevious className="static translate-x-0" />
            </div>
            </Carousel>
        </DialogContent>
    </Dialog>
  );
}


// These are needed because the TutorialView is not wrapped in a form, but uses Dialog
import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

