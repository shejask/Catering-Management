'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { toast } from 'sonner';
import {
  inventoryService,
  Product,
  ProductAllocation
} from '@/services/inventoryService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
   const [detailOpen, setDetailOpen] = useState(false);
   const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
   const [allocations, setAllocations] = useState<ProductAllocation[]>([]);
   const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await inventoryService.getAllProducts();
        setProducts(data);
      } catch (error) {
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchQuery))
  );

  const openProductDetail = async (product: Product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const data = await inventoryService.getProductAllocations(product.id);
      setAllocations(data);
    } catch (error) {
      toast.error('Failed to load product details');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeProductDetail = () => {
    setDetailOpen(false);
    setSelectedProduct(null);
    setAllocations([]);
  };

  const handlePrintBarcode = async () => {
    if (!selectedProduct) {
      return;
    }
    const barcode = selectedProduct.barcode || 'Generated-' + Date.now();

    try {
      const jsPDFModule = await import('jspdf');
      const JsPDFConstructor = jsPDFModule.default;
      const doc = new JsPDFConstructor();

      doc.setFontSize(18);
      doc.text('Product Barcode', 20, 30);

      doc.setFontSize(12);
      doc.text(`Name: ${selectedProduct.name}`, 20, 50);
      doc.text(`Barcode: ${barcode}`, 20, 60);

      doc.save(`${selectedProduct.name || 'barcode'}.pdf`);
      toast.success('Barcode PDF downloaded for testing');
    } catch (error) {
      toast.error('Failed to generate barcode PDF');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await inventoryService.deleteProduct(productId);
        toast.success('Product deleted successfully');
        setDetailOpen(false);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={`Inventory (${products.length})`}
            description='Manage your product inventory'
          />
          <Link href="/dashboard/inventory/add-product">
            <Button>
              <Icons.add className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
        <Separator />
        
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by name or barcode..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Barcode Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">No products found.</TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow
                      key={product.id}
                      className="cursor-pointer"
                      onClick={() => openProductDetail(product)}
                    >
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.quantity}</TableCell>
                      <TableCell>{product.barcode || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={detailOpen} onOpenChange={closeProductDetail}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {selectedProduct ? selectedProduct.name : 'Product details'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
               {selectedProduct && (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Current stock:</span>
                    <span>{selectedProduct.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Barcode:</span>
                    <span>{selectedProduct.barcode || '-'}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => selectedProduct && router.push(`/dashboard/inventory/add-product?id=${selectedProduct.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedProduct && handleDeleteProduct(selectedProduct.id)}
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handlePrintBarcode}
                  disabled={!selectedProduct}
                >
                  <Icons.barcode className="mr-2 h-4 w-4" />
                  Print Barcode
                </Button>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailLoading ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : allocations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">
                            No customer stocks for this product.
                          </TableCell>
                        </TableRow>
                      ) : (
                        allocations.map((allocation) => (
                          <TableRow key={allocation.customerId}>
                            <TableCell className="font-medium">
                              {allocation.customerName}
                            </TableCell>
                            <TableCell>{allocation.quantity}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
