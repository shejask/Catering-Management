'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { IconDatabase, IconDatabaseOff } from '@tabler/icons-react';
import { orderService } from '@/services/orderService';

export function FirebaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [orderCount, setOrderCount] = useState<number>(0);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const orders = await orderService.getAllOrders();
        setIsConnected(true);
        setOrderCount(orders.length);
      } catch (error) {
        setIsConnected(false);
        setOrderCount(0);
      }
    };

    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) {
    return (
      <Badge variant="outline" className="gap-1">
        <IconDatabase className="h-3 w-3" />
        Connecting...
      </Badge>
    );
  }

  return (
    <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
      {isConnected ? (
        <>
          <IconDatabase className="h-3 w-3" />
          Firebase Connected ({orderCount} orders)
        </>
      ) : (
        <>
          <IconDatabaseOff className="h-3 w-3" />
          Firebase Disconnected
        </>
      )}
    </Badge>
  );
}