'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { ScannerView } from '@/components/scanner-view';
import { ResultsView } from '@/components/results-view';
import { IngredientScannerView } from '@/components/ingredient-scanner-view';
import type { ScanResult, ScanError } from '@/app/actions';

export type PageState = 'scanning_barcode' | 'scanning_ingredients' | 'showing_results';

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [pageState, setPageState] = useState<PageState>('scanning_barcode');
  const [lastBarcode, setLastBarcode] = useState<string | null>(null);

  const handleScanResponse = (result: ScanResult | ScanError) => {
    if ('error' in result) {
      if (result.error === 'Product Not Found' && 'barcode' in result && typeof result.barcode === 'string') {
        setLastBarcode(result.barcode);
        setPageState('scanning_ingredients');
      }
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
    setLastBarcode(null);
    setPageState('scanning_barcode');
  };

  const renderContent = () => {
    switch (pageState) {
      case 'scanning_barcode':
        return <ScannerView onScanResponse={handleScanResponse} />;
      case 'scanning_ingredients':
        return <IngredientScannerView onScanSuccess={handleIngredientScanSuccess} barcode={lastBarcode} onReset={handleReset} />;
      case 'showing_results':
        return <ResultsView result={scanResult!} onReset={handleReset} />;
      default:
        return <ScannerView onScanResponse={handleScanResponse} />;
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
    </div>
  );
}
