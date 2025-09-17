import type { ScanResult } from '@/app/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusCard } from '@/components/status-card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface ResultsViewProps {
  result: ScanResult;
  onReset: () => void;
}

export function ResultsView({ result, onReset }: ResultsViewProps) {
  const ingredients = result.ingredients.split(',').map(i => i.trim()).filter(i => i);

  return (
    <div className="w-full max-w-md">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{result.productName}</CardTitle>
          <CardDescription>Barcode: {result.barcode}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusCard status={result.halalStatus} />
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-2 font-headline">Ingredients</h3>
            <div className="flex flex-wrap gap-2">
              {ingredients.length > 0 ? (
                ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="secondary">{ingredient}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No ingredients listed.</p>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onReset} variant="outline" className="w-full">Scan Another Product</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
