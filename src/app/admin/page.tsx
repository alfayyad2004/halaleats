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
import { ClassifyProductDialog } from '@/components/classify-product-dialog';


export default function AdminPage() {
  const { appUser, userLoading } = useUser();
  const router = useRouter();

  // Conditionally fetch data only if the user is an admin.
  const { data: products, loading: productsLoading } = useCollection<UnrecognizedProduct>('unrecognizedProducts', {
    sort: { field: 'createdAt', order: 'desc' },
    disabled: !appUser || appUser.role !== 'admin'
  });

  useEffect(() => {
    // If loading is finished and the user is not an admin, redirect them.
    if (!userLoading && (!appUser || appUser.role !== 'admin')) {
      router.push('/');
    }
  }, [appUser, userLoading, router]);

  // While checking auth, show a loader.
  if (userLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="animate-spin" />
        </div>
    );
  }

  // If after loading, there's still no admin user, don't render the page.
  // The useEffect above will handle the redirect.
  if (!appUser || appUser.role !== 'admin') {
      return null;
  }

  const reviewedProducts = products.filter(p => p.reviewed);
  const unreviewedProducts = products.filter(p => !p.reviewed);

  const renderProductTable = (title: string, productList: UnrecognizedProduct[]) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Scanned On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productList.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell className="font-mono">{product.barcode}</TableCell>
                            <TableCell>{product.submittedByEmail || 'Anonymous'}</TableCell>
                            <TableCell>{product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>
                                <Badge variant={product.reviewed ? 'secondary' : 'outline'}>
                                    {product.reviewed ? 'Reviewed' : 'Needs Review'}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <ClassifyProductDialog product={product} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )}
        {!productsLoading && productList.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
                No products in this category.
            </p>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            {renderProductTable('Needs Review', unreviewedProducts)}
            {renderProductTable('Reviewed', reviewedProducts)}
        </div>
      </main>
    </div>
  );
}
