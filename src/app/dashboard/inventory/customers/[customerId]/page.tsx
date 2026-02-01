'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { inventoryService, Customer, Product } from '@/services/inventoryService';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ScannedItem {
  product: Product;
  quantity: number;
}

export default function CustomerViewPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [checkDate, setCheckDate] = useState<string>('');
  
  const customerId = params.customerId as string;

  useEffect(() => {
    // Set Oman Date on mount to avoid hydration mismatch
    try {
      const d = new Date().toLocaleString("en-US", { timeZone: "Asia/Muscat" });
      const date = new Date(d);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setCheckDate(`${year}-${month}-${day}`);
    } catch (e) {
      setCheckDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!customerId) return;
      
      try {
        const data = await inventoryService.getCustomerById(customerId);
        if (data) {
          setCustomer(data);
          // Load scanned items if they exist
          if (data.scannedItems) {
            const itemsWithDetails = await Promise.all(
              data.scannedItems.map(async (item) => {
                const product = await inventoryService.getProductById(item.productId);
                return product ? { product, quantity: item.quantity } : null;
              })
            );
            setScannedItems(itemsWithDetails.filter((i): i is ScannedItem => i !== null));
          }
        } else {
          toast.error('Customer not found');
          router.push('/dashboard/inventory/customers');
        }
      } catch (error) {
        toast.error('Failed to load customer details');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId, router]);

  const handleScanSuccess = async (decodedText: string) => {
    if (!customer) return;

    // Date Validation
    if (!customer.deliveryDate) {
      toast.error('This customer has no delivery date set.');
      return;
    }

    if (customer.deliveryDate !== checkDate) {
      toast.error(`Date mismatch! Delivery: ${customer.deliveryDate}, Check: ${checkDate}`);
      return;
    }

    try {
      const product = await inventoryService.getProductByBarcode(decodedText);
      if (product) {
        // Dispatch Item (Minus Inventory, Add to Customer)
        await inventoryService.dispatchCustomerItem(customerId, product.id, 1);
        
        setScannedItems(prev => {
          const existing = prev.find(item => item.product.id === product.id);
          if (existing) {
            toast.success(`Dispatched ${product.name} (Qty: ${existing.quantity + 1})`);
            return prev.map(item => 
              item.product.id === product.id 
                ? { ...item, quantity: item.quantity + 1 } 
                : item
            );
          }
          toast.success(`Dispatched ${product.name}`);
          return [...prev, { product, quantity: 1 }];
        });
      } else {
        toast.error(`Product not found for barcode: ${decodedText}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error processing scan');
    }
  };

  const removeItem = (productId: string) => {
    // Note: removeItem in this context only removes from LOCAL VIEW?
    // Or should it Return to Inventory?
    // Given the "Dispatch" nature, maybe we shouldn't allow easy delete without "Return" logic?
    // But for now, let's keep it as local view modification or disable it?
    // The user didn't specify "Undo Dispatch".
    // I'll leave it as local view modification but warn user it doesn't return stock?
    // Actually, updateCustomerItems was removed. So removeItem here does NOTHING to DB.
    // I should probably remove the "Trash" icon or implement "Return" logic.
    // Safest: Remove the Trash icon/functionality for now to prevent desync.
    // Or just make it cosmetic.
    // Let's implement basic "Undo" (Return) logic for consistency.
    
    // BUT, the user didn't ask for this. I will just keep local state update for now
    // but since there is no "Save" button, this local state update is misleading!
    // If I remove item locally, it is NOT removed from DB.
    // So I MUST implement DB update or remove the delete button.
    // I will remove the delete button from UI to be safe.
    
    // However, I'll comment out the removeItem function.
    setScannedItems(prev => prev.filter(item => item.product.id !== productId));
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="flex h-full items-center justify-center pt-10">
          <Icons.spinner className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title={`Customer: ${customer.name}`}
            description="View customer details and dispatch items"
          />
          <Button variant="outline" onClick={() => router.back()}>
            <Icons.chevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
        <Separator />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Heading title="Scanned Products" description="Manage products for this customer" />
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <span className="text-sm font-medium whitespace-nowrap">Check Date:</span>
               <Input 
                 type="date" 
                 value={checkDate} 
                 onChange={(e) => setCheckDate(e.target.value)}
                 className="w-full sm:w-40"
               />
            </div>
            <Button onClick={() => setShowScanner(true)} className="w-full sm:w-auto">
              <Icons.scan className="mr-2 h-4 w-4" />
              Scan Product
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product List ({scannedItems.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    {/* <TableHead>Actions</TableHead> */} 
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No products scanned yet.</TableCell>
                    </TableRow>
                  ) : (
                    scannedItems.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell className="font-medium whitespace-nowrap">{item.product.name}</TableCell>
                        <TableCell>{item.product.barcode || '-'}</TableCell>
                        <TableCell>{item.product.price ? `$${item.product.price}` : '-'}</TableCell>
                        <TableCell>
                          <span>{item.quantity}</span>
                        </TableCell>
                        <TableCell>
                          {item.product.price ? `$${(item.product.price * item.quantity).toFixed(2)}` : '-'}
                        </TableCell>
                        {/* 
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Icons.trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell> 
                        */}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scan Barcode (Dispatch)</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <BarcodeScanner 
                onScanSuccess={handleScanSuccess} 
                onClose={() => setShowScanner(false)} 
              />
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </PageContainer>
  );
}
