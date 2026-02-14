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

interface ScanReturnSheetProps {
  barcodeId: string;
  customerId: string;
  triggerLabel?: string;
}

export function ScanReturnSheet({ barcodeId, customerId, triggerLabel = 'Scan return' }: ScanReturnSheetProps) {
  const [open, setOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const returnProductToInventory = useInventoryCustomersStore((s) => s.returnProductToInventory);

  const handleScan = (decodedText: string) => {
    setScannedBarcode(decodedText);
    setSuccess(false);
  };

  const handleConfirm = () => {
    if (!scannedBarcode) return;
    const ok = returnProductToInventory(scannedBarcode, customerId);
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

  const match = scannedBarcode === barcodeId;

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="touch-manipulation min-h-[40px]">
          <Icons.scan className="h-4 w-4 mr-1" />
          {triggerLabel}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85dvh] flex flex-col rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Scan return — confirm barcode</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-auto space-y-4 pb-4">
          {success ? (
            <p className="text-center text-green-600 font-medium py-8">Product returned to inventory.</p>
          ) : (
            <>
              <BarcodeScanner
                onScan={handleScan}
                onError={() => setScannedBarcode(null)}
              />
              {scannedBarcode && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
                  {match ? (
                    <>
                      <p className="font-medium text-green-600">Barcode matches. Confirm return.</p>
                      <Button
                        className="w-full touch-manipulation min-h-[48px]"
                        onClick={handleConfirm}
                      >
                        Confirm return to inventory
                      </Button>
                    </>
                  ) : (
                    <p className="text-destructive">Scanned barcode does not match this assignment.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
