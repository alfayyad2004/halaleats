'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { ScannerView } from '@/components/scanner-view';
import { ResultsView } from '@/components/results-view';
import { IngredientScannerView } from '@/components/ingredient-scanner-view';
import { SubmitReviewView } from '@/components/submit-review-view';
import type { ScanResult, ScanError } from '@/app/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Barcode, ScanText } from 'lucide-react';
import { HalalEatsLogo } from '@/components/halal-eats-logo';

export type PageState = 'selection' | 'scanning_barcode' | 'scanning_ingredients' | 'showing_results' | 'submit_review';

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [pageState, setPageState] = useState<PageState>('selection');
  const [unrecognizedBarcode, setUnrecognizedBarcode] = useState<string | null>(null);

  const handleScanResponse = (result: ScanResult | ScanError) => {
    if ('error' in result) {
      if (result.error === 'Product Not Found' && result.barcode) {
        setUnrecognizedBarcode(result.barcode);
        setPageState('submit_review');
      }
      // Other errors are handled by the component via toast
      return;
    } else {
      setScanResult(result);
      setPageState('showing_results');
    }
  };

  const handleIngredientScanSuccess = (result: ScanResult) => {
    setScanResult(result);
    setPageState('showing_results');
  };

  const handleReset = () => {
    setScanResult(null);
    setUnrecognizedBarcode(null);
    setPageState('selection');
  };
  
  const renderContent = () => {
    switch (pageState) {
      case 'selection':
        return (
          <Card className="shadow-lg overflow-hidden">
            <div className="relative aspect-video w-full flex items-center justify-center bg-primary/5 p-4">
              <HalalEatsLogo className="w-48 h-auto" />
            </div>
            <CardHeader className="text-center">
              <CardTitle className="font-headline text-3xl">Welcome to HalalEats</CardTitle>
              <CardDescription className="text-base">
                Your guide to making conscious, Halal food choices.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="text-center text-muted-foreground px-4">
                Scan a product's barcode or take a picture of its ingredients to check its Halal status instantly.
              </p>
              <Button size="lg" onClick={() => setPageState('scanning_barcode')}>
                <Barcode className="mr-2" /> Scan Barcode
              </Button>
              <Button size="lg" variant="outline" onClick={() => setPageState('scanning_ingredients')}>
                <ScanText className="mr-2" /> Scan Ingredients
              </Button>
            </CardContent>
          </Card>
        );
      case 'scanning_barcode':
        return <ScannerView onScanResponse={handleScanResponse} onReset={handleReset} />;
      case 'scanning_ingredients':
        return <IngredientScannerView onScanSuccess={handleIngredientScanSuccess} onReset={handleReset} />;
      case 'showing_results':
        return <ResultsView result={scanResult!} onReset={handleReset} />;
      case 'submit_review':
        return <SubmitReviewView barcode={unrecognizedBarcode!} onSubmitted={handleReset} onReset={handleReset} />;
      default:
        return <ScannerView onScanResponse={handleScanResponse} onReset={handleReset} />;
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex flex-col">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
            {renderContent()}
        </div>
      </main>
      <footer className="w-full bg-secondary/50 text-secondary-foreground p-6 text-center text-xs">
          <div className="max-w-3xl mx-auto space-y-2 text-muted-foreground">
              <p>
                  As-salamu alaykum. I am Fayyad Amir Gosein, the developer of HalalEats. My goal is to help you make quick, confident choices at the shelf. The app checks ingredients from trusted sources and applies clear rules to label items as Halal, Haram, Doubtful, or Unknown, along with the reasons. This is a tool for guidance, not a fatwa. When in doubt, please consult your local scholars.
              </p>
              <p>
                  If a product is missing or incorrect, tap “Report a correction.” Jazakallah khair for helping us build better local coverage.
              </p>
              <p>
                  Contact: <a href="mailto:alfayyadgos@gmail.com" className="text-primary underline">alfayyadgos@gmail.com</a>
              </p>
          </div>
      </footer>
    </div>
  );
}
