'use client';

import { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { cn } from '@/lib/utils';

interface BarcodeDisplayProps {
  value: string;
  productName?: string;
  className?: string;
  width?: number;
  height?: number;
}

export function BarcodeDisplay({ value, productName, className, width = 2, height = 50 }: BarcodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;
    try {
      JsBarcode(canvasRef.current, value, {
        format: 'CODE128',
        width,
        height,
        displayValue: true,
        margin: 8,
        fontOptions: '',
        font: 'monospace'
      });
    } catch (e) {
      console.warn('Barcode render error', e);
    }
  }, [value, width, height]);

  if (!value) return null;

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {productName && (
        <span className="text-xs font-medium text-center max-w-[200px] truncate" title={productName}>
          {productName}
        </span>
      )}
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  );
}
