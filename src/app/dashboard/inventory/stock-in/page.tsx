'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { inventoryService, Customer, Product } from '@/services/inventoryService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface ScannedItem {
  product: Product;
  quantity: number;
  customerId: string;
  customerName: string;
}

export default function StockInPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [returnDate, setReturnDate] = useState<string>('');

  useEffect(() => {
    // Set Oman Date on mount
    try {
      const d = new Date().toLocaleString("en-US", { timeZone: "Asia/Muscat" });
      const date = new Date(d);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setReturnDate(`${year}-${month}-${day}`);
    } catch (e) {
      setReturnDate(new Date().toISOString().split('T')[0]);
    }

    const fetchCustomers = async () => {
      try {
        const data = await inventoryService.getAllCustomers();
        setCustomers(data);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load customers');
      }
    };
    fetchCustomers();
  }, []);

  // Clear scanned items if date changes
  useEffect(() => {
    setScannedItems([]);
  }, [returnDate]);

  const handleScanSuccess = async (decodedText: string) => {
    if (!returnDate) {
      toast.error('Please select a date first');
      return;
    }

    try {
      const product = await inventoryService.getProductByBarcode(decodedText);
      if (!product) {
        toast.error(`Product not found for barcode: ${decodedText}`);
        return;
      }

      // Find customers with matching date AND having this product
      const matchingCustomers = customers.filter(c => {
        if (c.deliveryDate !== returnDate) return false;
        const hasItem = c.scannedItems?.some(item => item.productId === product.id && item.quantity > 0);
        return hasItem;
      });

      if (matchingCustomers.length === 0) {
        toast.warning(`No customer found with ${product.name} for date ${returnDate}`);
        return;
      }

      // If multiple, we pick the first one (as per simple flow requirement)
      // Ideally we might want to prioritize one that hasn't been fully returned yet?
      // But we just check current quantity > 0 above.
      
      // We also need to check if we already scanned this item for this customer in the current session
      // and if the total quantity (scanned + already returned?) exceeds?
      // For now, let's just pick the first match.
      const targetCustomer = matchingCustomers[0];

      setScannedItems(prev => {
        // Check if we already have this product for this customer in our list
        const existingIndex = prev.findIndex(
          item => item.product.id === product.id && item.customerId === targetCustomer.id
        );

        if (existingIndex !== -1) {
          // Check if adding 1 exceeds what the customer has?
          // We can't easily check "what they have minus what we already planned to return" without more complex logic.
          // Let's just increment.
          const newItems = [...prev];
          newItems[existingIndex].quantity += 1;
          toast.success(`Updated return quantity for ${product.name} (${targetCustomer.name})`);
          return newItems;
        }

        toast.success(`Found ${product.name} from ${targetCustomer.name}`);
        return [...prev, {
          product,
          quantity: 1,
          customerId: targetCustomer.id,
          customerName: targetCustomer.name
        }];
      });

    } catch (error) {
      console.error(error);
      toast.error('Error processing scan');
    }
  };

  const updateQuantity = (productId: string, customerId: string, delta: number) => {
    setScannedItems(prev => prev.map(item => {
      if (item.product.id === productId && item.customerId === customerId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (productId: string, customerId: string) => {
    setScannedItems(prev => prev.filter(item => 
      !(item.product.id === productId && item.customerId === customerId)
    ));
  };

  const handleConfirmReturn = async () => {
    if (scannedItems.length === 0) return;

    setProcessing(true);
    try {
      // Group items by customer
      const itemsByCustomer: Record<string, { productId: string; quantity: number }[]> = {};
      
      scannedItems.forEach(item => {
        if (!itemsByCustomer[item.customerId]) {
          itemsByCustomer[item.customerId] = [];
        }
        itemsByCustomer[item.customerId].push({
          productId: item.product.id,
          quantity: item.quantity
        });
      });

      // Process each customer
      for (const [custId, items] of Object.entries(itemsByCustomer)) {
        await inventoryService.returnCustomerItems(custId, items);
      }
      
      toast.success('Stock returned successfully');
      setScannedItems([]);
      
      // Refresh customers to get updated stock
      const data = await inventoryService.getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to process return');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <Heading
          title="Stock In (Return)"
          description="Return items from customers to inventory based on date"
        />
        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Return Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 w-full md:w-1/3">
                <label className="text-sm font-medium">Event Date (Delivery Date)</label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <Button 
                  onClick={handleConfirmReturn} 
                  disabled={scannedItems.length === 0 || processing}
                  variant="default"
                  className="w-full md:w-auto"
                >
                  {processing ? <Icons.spinner className="mr-2 h-4 w-4 animate-spin" /> : <Icons.check className="mr-2 h-4 w-4" />}
                  Confirm Return ({scannedItems.length})
                </Button>
                <Button onClick={() => setShowScanner(true)} variant="outline" className="w-full md:w-auto">
                  <Icons.scan className="mr-2 h-4 w-4" />
                  Scan Product
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {scannedItems.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Return Qty</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scannedItems.map((item) => (
                      <TableRow key={`${item.product.id}-${item.customerId}`}>
                        <TableCell className="font-medium">{item.product.name}</TableCell>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell>{item.product.barcode || '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={() => updateQuantity(item.product.id, item.customerId, -1)}
                            >
                              <Icons.minus className="h-3 w-3" />
                            </Button>
                            <span>{item.quantity}</span>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.product.id, item.customerId, 1)}
                            >
                              <Icons.add className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItem(item.product.id, item.customerId)}
                          >
                            <Icons.trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        )}

        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scan Item to Return</DialogTitle>
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
