'use client';

import { ScanBarcode, Info, BookOpen, User, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { nonHalalIngredients } from '@/lib/halal-data';
import { useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

export function AppHeader() {
  const { appUser, auth } = useUser();
  return (
    <header className="flex items-center justify-between p-4 border-b bg-card">
      <div className="flex items-center gap-3">
        <ScanBarcode className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-headline font-bold text-foreground">
          HalalEats
        </h1>
      </div>
      <div className='flex items-center gap-2'>
         {appUser ? (
          <>
            {appUser.role === 'admin' && (
              <Link href="/admin">
                <Button variant="ghost" size="icon" title="Admin Dashboard">
                  <User className="w-6 h-6" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" onClick={() => auth && signOut(auth)} title="Log Out">
              <LogOut className="w-6 h-6" />
            </Button>
          </>
        ) : (
          <Link href="/login">
            <Button variant="ghost" size="sm">Admin Login</Button>
          </Link>
        )}
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <BookOpen className="w-6 h-6" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>How HalalEats Works</DialogTitle>
                    <DialogDescription>
                        An overview of the technology behind your Halal food guide.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-2 space-y-4 text-sm text-muted-foreground">
                    <p>
                        HalalEats uses a combination of public data and cutting-edge Artificial Intelligence to help you make informed decisions.
                    </p>
                    <div>
                        <h4 className='font-semibold text-foreground mb-1'>1. Barcode Scanning</h4>
                        <p>
                            When you scan a barcode, the app queries the <a href="https://world.openfoodfacts.org/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Open Food Facts</a> database, a massive, open-source collection of food product information, to retrieve the product's name and ingredient list.
                        </p>
                    </div>
                    <div>
                        <h4 className='font-semibold text-foreground mb-1'>2. Ingredient Scanning with AI</h4>
                        <p>
                            If you scan an ingredient list from an image, we use Google's powerful Gemini AI model. The AI analyzes the image, identifies, and extracts the ingredient text.
                        </p>
                    </div>
                     <div>
                        <h4 className='font-semibold text-foreground mb-1'>3. Halal Status Analysis</h4>
                        <p>
                            Once the ingredients are identified, they are passed to another AI model. This model cross-references the list against a known database of non-Halal ingredients and considers the product's brand to determine a final status: Halal, Not Halal, or Doubtful.
                        </p>
                    </div>
                     <p className="mt-4 text-xs">
                        Disclaimer: This app is a helpful guide, but not a replacement for official certification. Always verify with certified authorities if you have doubts.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
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
      </div>
    </header>
  );
}
