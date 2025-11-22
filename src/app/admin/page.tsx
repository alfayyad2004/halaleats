'use client';

import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { UnrecognizedProduct } from '@/lib/types';


export default function AdminPage() {
  const { appUser, loading: userLoading } = useUser();
  const router = useRouter();
  const { data: products, loading: productsLoading } = useCollection<UnrecognizedProduct>('unrecognizedProducts', {
    filter: { field: 'reviewed', operator: '==', value: false },
    sort: { field: 'createdAt', order: 'desc' }
  });

  useEffect(() => {
    if (!userLoading && (!appUser || appUser.role !== 'admin')) {
      router.push('/login');
    }
  }, [appUser, userLoading, router]);

  if (userLoading || !appUser || appUser.role !== 'admin') {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="animate-spin" />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Unrecognized Products</CardTitle>
                    <CardDescription>
                        Review products that were scanned but not found in the database.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {productsLoading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader className="animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead>Scanned On</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-mono">{product.barcode}</TableCell>
                                        <TableCell>{product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Badge variant={product.reviewed ? 'secondary' : 'outline'}>
                                                {product.reviewed ? 'Reviewed' : 'Needs Review'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" disabled>Classify</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                    {!productsLoading && products.length === 0 && (
                        <p className="text-center text-muted-foreground py-10">
                            No unrecognized products to review.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
