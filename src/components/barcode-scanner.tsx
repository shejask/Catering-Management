'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanFailure?: (error: any) => void;
  onClose?: () => void;
}

export function BarcodeScanner({
  onScanSuccess,
  onScanFailure,
  onClose
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Use a small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        'reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          onScanSuccess(decodedText);
          // Optional: Stop scanning after success if needed, 
          // but usually we want continuous scanning or let parent decide
        },
        (errorMessage) => {
          if (onScanFailure) onScanFailure(errorMessage);
        }
      );

      scannerRef.current = scanner;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [mounted, onScanSuccess, onScanFailure]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div id="reader" className="w-full overflow-hidden rounded-lg border bg-black" />
      {onClose && (
        <Button
          variant="destructive"
          size="sm"
          className="mt-4 w-full"
          onClick={() => {
            if (scannerRef.current) {
              scannerRef.current.clear().catch(console.error);
            }
            onClose();
          }}
        >
          <Icons.close className="mr-2 h-4 w-4" />
          Close Scanner
        </Button>
      )}
    </div>
  );
}
