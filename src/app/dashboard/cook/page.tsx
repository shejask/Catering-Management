'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconChefHat, IconRefresh } from '@tabler/icons-react';
import { orderService, OrderData } from '@/services/orderService';
import { useLanguage } from '@/contexts/language-context';

export default function CookPage() {
  const [activeOrders, setActiveOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchKitchenData = async () => {
      try {
        setLoading(true);
        const allOrders = await orderService.getAllOrders();
        
        // Filter active orders (pending, preparing, ready)
        const active = allOrders.filter(order => 
          order.cookStatus === 'pending' || 
          order.cookStatus === 'preparing' || 
          order.cookStatus === 'ready'
        );

        setActiveOrders(active);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching kitchen data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKitchenData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchKitchenData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (cookStatus: string) => {
    switch (cookStatus) {
      case 'pending':
        return <Badge variant="secondary">{t('status.pending')}</Badge>;
      case 'preparing':
        return <Badge variant="default">{t('status.preparing')}</Badge>;
      case 'ready':
        return <Badge variant="outline">{t('status.ready')}</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">{t('status.delivered')}</Badge>;
      default:
        return <Badge variant="outline">{t('status.unknown')}</Badge>;
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: 'preparing' | 'ready' | 'delivered') => {
    try {
      // Find the current order to preserve all data
      const currentOrder = activeOrders.find(order => order.orderId === orderId);
      if (!currentOrder) {
        // eslint-disable-next-line no-console
        console.error('Order not found:', orderId);
        return;
      }

      // Update the order with all existing data plus new status
      const updatedOrder = {
        ...currentOrder,
        cookStatus: newStatus
      };

      await orderService.updateOrder(orderId, updatedOrder);
      
      // Update local state immediately for better UX
      setActiveOrders(prevOrders => 
        prevOrders.map(order => 
          order.orderId === orderId 
            ? { ...order, cookStatus: newStatus }
            : order
        )
      );

      // Also refresh from server to ensure consistency
      const allOrders = await orderService.getAllOrders();
      const active = allOrders.filter(order => 
        order.cookStatus === 'pending' || 
        order.cookStatus === 'preparing' || 
        order.cookStatus === 'ready'
      );
      setActiveOrders(active);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-4 md:pt-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-muted-foreground">{t('message.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-2 sm:p-4 md:p-8 pt-4 md:pt-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('page.kitchen')}</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <IconRefresh className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t('action.refresh')}</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Orders as Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {activeOrders.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <IconChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('cook.noOrders')}</p>
          </div>
        ) : (
          activeOrders.map((order) => (
            <Card key={order.orderId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex flex-col space-y-2 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg truncate">{order.name}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">#{order.receiptNo}</CardDescription>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(order.cookStatus || 'pending')}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-0">
                {/* Order Details */}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">{t('cook.orderDetails')}</p>
                  <p className="text-xs sm:text-sm bg-muted p-2 sm:p-3 rounded border break-words">
                    {order.orderDetails || t('message.noOrderDetails')}
                  </p>
                </div>

                {/* Order Info */}
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex-shrink-0 mr-2">{t('info.customer')}:</span>
                    <span className="text-right truncate">{order.name || t('info.unknownCustomer')}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex-shrink-0 mr-2">{t('info.date')}:</span>
                    <span className="text-right">{order.date || t('info.noDate')}</span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground flex-shrink-0 mr-2">{t('info.time')}:</span>
                    <span className="text-right">{order.time || t('info.noTime')}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {order.cookStatus === 'pending' && (
                    <Button 
                      className="flex-1 text-xs sm:text-sm py-2"
                      onClick={() => handleStatusUpdate(order.orderId!, 'preparing')}
                    >
                      {t('button.startPreparing')}
                    </Button>
                  )}
                  {order.cookStatus === 'preparing' && (
                    <Button 
                      className="flex-1 text-xs sm:text-sm py-2"
                      onClick={() => handleStatusUpdate(order.orderId!, 'ready')}
                    >
                      {t('button.markReady')}
                    </Button>
                  )}
                  {order.cookStatus === 'ready' && (
                    <Button 
                      className="flex-1 text-xs sm:text-sm py-2"
                      variant="outline"
                      onClick={() => handleStatusUpdate(order.orderId!, 'delivered')}
                    >
                      {t('button.markDelivered')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}