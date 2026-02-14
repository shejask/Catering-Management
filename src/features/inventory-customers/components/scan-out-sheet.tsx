'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useInventoryCustomersStore } from '@/stores/inventory-customers-store';
import { BarcodeScanner } from './barcode-scanner';
import { Icons } from '@/components/icons';

export function ScanOutSheet() {
  const [open, setOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [dateAssigned, setDateAssigned] = useState(() => new Date().toISOString().slice(0, 10));
  const [success, setSuccess] = useState(false);

  const getProductByBarcode = useInventoryCustomersStore((s) => s.getProductByBarcode);
  const getCustomerById = useInventoryCustomersStore((s) => s.getCustomerById);
  const assignProductToCustomer = useInventoryCustomersStore((s) => s.assignProductToCustomer);
  const customers = useInventoryCustomersStore((s) => s.customers);

  const product = scannedBarcode ? getProductByBarcode(scannedBarcode) : null;

  const handleScan = (decodedText: string) => {
    setScannedBarcode(decodedText);
    setSuccess(false);
  };

  const handleConfirm = () => {
    if (!scannedBarcode || !customerId || !dateAssigned) return;
    const ok = assignProductToCustomer(scannedBarcode, customerId, dateAssigned);
    if (ok) {
      setSuccess(true);
      setScannedBarcode(null);
      setCustomerId('');
      setDateAssigned(new Date().toISOString().slice(0, 10));
      setTimeout(() => setOpen(false), 1200);
    }
  };

  const reset = () => {
    setScannedBarcode(null);
    setCustomerId('');
    setDateAssigned(new Date().toISOString().slice(0, 10));
    setSuccess(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px]">
          <Icons.scan className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Scan OUT</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Scan OUT — Assign product to customer</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto space-y-4 pb-4">
          {success ? (
            <p className="text-center text-green-600 font-medium py-8">Product assigned. Quantity reduced.</p>
          ) : (
            <>
              <BarcodeScanner
                onScan={handleScan}
                onError={() => setScannedBarcode(null)}
              />
              {product && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                  <p className="font-medium">Product: {product.productName}</p>
                  <p className="text-sm text-muted-foreground">Category: {product.category} · Barcode: {product.barcodeId}</p>
                  <div className="space-y-2">
                    <Label>Select customer (required)</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date (required)</Label>
                    <Input
                      type="date"
                      value={dateAssigned}
                      onChange={(e) => setDateAssigned(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full touch-manipulation min-h-[48px]"
                    onClick={handleConfirm}
                    disabled={!customerId || !dateAssigned}
                  >
                    Confirm — assign to customer & reduce stock
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
