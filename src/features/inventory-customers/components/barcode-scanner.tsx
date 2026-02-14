'use client';

import { useEffect, useRef, useState, useId } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onError?: (err: string) => void;
  className?: string;
}

export function BarcodeScanner({ onScan, onError, className }: BarcodeScannerProps) {
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'barcode-reader-' + useId().replace(/:/g, '');

  const start = async () => {
    try {
      setError(null);
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;
      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (w: number, h: number) => ({ width: Math.min(280, w, h), height: Math.min(280, w, h) })
        },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {}
      );
      setStarted(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Camera access failed';
      setError(msg);
      onError?.(msg);
    }
  };

  const stop = async () => {
    if (scannerRef.current && started) {
      try {
        await scannerRef.current.stop();
      } catch (_) {}
      scannerRef.current = null;
      setStarted(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className={className}>
      <div id={containerId} className="min-h-[200px] w-full rounded-lg overflow-hidden bg-black" />
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
      <div className="mt-2 flex gap-2">
        {!started ? (
          <button
            type="button"
            onClick={start}
            className="flex-1 rounded-md bg-primary px-4 py-3 text-primary-foreground font-medium touch-manipulation min-h-[48px]"
          >
            Start camera
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="flex-1 rounded-md border border-input bg-background px-4 py-3 font-medium touch-manipulation min-h-[48px]"
          >
            Stop camera
          </button>
        )}
      </div>
    </div>
  );
}
