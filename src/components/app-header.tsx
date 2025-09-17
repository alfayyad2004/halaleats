import { ScanBarcode } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="flex items-center gap-3 p-4 border-b bg-card">
      <ScanBarcode className="w-8 h-8 text-primary" />
      <h1 className="text-2xl font-headline font-bold text-foreground">
        Halal Scanner
      </h1>
    </header>
  );
}
