'use client';

import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import type { InventoryProduct } from '@/stores/inventory-customers-store';

const LABEL_WIDTH = 60;
const LABEL_HEIGHT = 40;
const PADDING = 8;

function drawBarcodeToCanvas(value: string, productName: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 1.6,
    height: 28,
    displayValue: true,
    margin: 4,
    font: 'monospace'
  });
  return canvas;
}

export function downloadBarcodePDF(products: InventoryProduct[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const cols = Math.floor(pageWidth / (LABEL_WIDTH + PADDING));
  let x = PADDING;
  let y = PADDING;
  const rowHeight = LABEL_HEIGHT + PADDING;

  products.forEach((p) => {
    const canvas = drawBarcodeToCanvas(p.barcodeId, p.productName);
    const imgData = canvas.toDataURL('image/png');
    const imgW = 50;
    const imgH = 18;

    doc.setFontSize(8);
    doc.text(p.productName.substring(0, 24) + (p.productName.length > 24 ? '...' : ''), x, y + 5);
    doc.addImage(imgData, 'PNG', x, y + 6, imgW, imgH);
    doc.setFontSize(6);
    doc.text(p.barcodeId, x, y + LABEL_HEIGHT - 2);

    x += LABEL_WIDTH + PADDING;
    if (x + LABEL_WIDTH > pageWidth) {
      x = PADDING;
      y += rowHeight;
      if (y + rowHeight > doc.internal.pageSize.getHeight() - 15) {
        doc.addPage();
        y = PADDING;
      }
    }
  });

  doc.save('barcodes.pdf');
}
