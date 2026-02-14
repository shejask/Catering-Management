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
import { useInventoryCustomersStore } from '@/stores/inventory-customers-store';
import { BarcodeScanner } from './barcode-scanner';
import { Icons } from '@/components/icons';

export function ScanInSheet() {
  const [open, setOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const getAssignmentByBarcode = useInventoryCustomersStore((s) => s.getAssignmentByBarcode);
  const returnProductToInventory = useInventoryCustomersStore((s) => s.returnProductToInventory);

  const assignment = scannedBarcode ? getAssignmentByBarcode(scannedBarcode) : null;

  const handleScan = (decodedText: string) => {
    setScannedBarcode(decodedText);
    setSuccess(false);
  };

  const handleConfirm = () => {
    if (!scannedBarcode) return;
    const ok = returnProductToInventory(scannedBarcode);
    if (ok) {
      setSuccess(true);
      setScannedBarcode(null);
      setTimeout(() => setOpen(false), 1200);
    }
  };

  const reset = () => {
    setScannedBarcode(null);
    setSuccess(false);
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="touch-manipulation min-h-[44px]">
          <Icons.scan className="h-5 w-5 sm:mr-2" />
          <span className="hidden sm:inline">Scan IN</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[90dvh] flex flex-col rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Scan IN — Return product to inventory</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto space-y-4 pb-4">
          {success ? (
            <p className="text-center text-green-600 font-medium py-8">Product returned. Quantity increased.</p>
          ) : (
            <>
              <BarcodeScanner
                onScan={handleScan}
                onError={() => setScannedBarcode(null)}
              />
              {scannedBarcode && !assignment && (
                <p className="text-destructive text-sm">No active assignment found for this barcode. It may already be in inventory.</p>
              )}
              {assignment && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                  <p className="font-medium">Product: {assignment.productName}</p>
                  <p className="text-sm text-muted-foreground">With customer: {assignment.customerName}</p>
                  <Button
                    className="w-full touch-manipulation min-h-[48px]"
                    onClick={handleConfirm}
                  >
                    Confirm — return to inventory
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
