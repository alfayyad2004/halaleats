'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { ScannerView } from '@/components/scanner-view';
import { ResultsView } from '@/components/results-view';
import type { ScanResult } from '@/app/actions';

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleScanSuccess = (result: ScanResult) => {
    setScanResult(result);
  };

  const handleReset = () => {
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-body flex flex-col">
      <AppHeader />
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        {!scanResult ? (
          <ScannerView onScanSuccess={handleScanSuccess} />
        ) : (
          <ResultsView result={scanResult} onReset={handleReset} />
        )}
      </main>
    </div>
  );
}
