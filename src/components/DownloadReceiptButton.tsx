import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Receipt } from 'lucide-react';
import { downloadOrderReceipt, OrderWithStatus } from '@/lib/pdf-utils';

interface DownloadReceiptButtonProps {
  order: OrderWithStatus;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const DownloadReceiptButton: React.FC<DownloadReceiptButtonProps> = ({
  order,
  className = '',
  variant = 'outline',
  size = 'sm'
}) => {
  const handleDownload = async () => {
    try {
      downloadOrderReceipt(order);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to download receipt:', error);
      // You can add a toast notification here if you have one
      alert('Failed to download receipt. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant={variant}
      size={size}
      className={`gap-2 ${className}`}
      title="Download Receipt"
    >
      <Receipt className="h-4 w-4" />
      Download Receipt
    </Button>
  );
};

// Alternative button with just icon and tooltip
export const DownloadReceiptIconButton: React.FC<DownloadReceiptButtonProps> = ({
  order,
  className = '',
  variant = 'ghost',
  size = 'icon'
}) => {
  const handleDownload = async () => {
    try {
      downloadOrderReceipt(order);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to download receipt:', error);
      alert('Failed to download receipt. Please try again.');
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant={variant}
      size={size}
      className={className}
      title="Download Receipt"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default DownloadReceiptButton;
