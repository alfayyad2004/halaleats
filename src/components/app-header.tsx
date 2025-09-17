import { ScanBarcode, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { nonHalalIngredients } from '@/lib/halal-data';

export function AppHeader() {
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-3">
        <ScanBarcode className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-headline font-bold text-foreground">
          Halal Scanner
        </h1>
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Info className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Impermissible Ingredients</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4 text-muted-foreground">
              The app checks for the following ingredients which are generally considered haram (impermissible).
            </p>
            <div className="flex flex-wrap gap-2">
              {nonHalalIngredients.map((ingredient) => (
                <Badge key={ingredient} variant="destructive">{ingredient}</Badge>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              This list is not exhaustive and is for general guidance. Always verify with a certified authority if you have doubts.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
