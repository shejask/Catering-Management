'use client';

// 🔥 DYNAMIC FIREBASE DASHBOARD 🔥
// Calculates KPIs from Firebase Realtime Database
// Database: https://aneesh--catering-default-rtdb.firebaseio.com/

import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/contexts/language-context';
import { orderService, type OrderData } from '@/services/orderService';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { IconTrendingDown, IconTrendingUp, IconLoader, IconUsers, IconCash, IconChefHat, IconCreditCard } from '@tabler/icons-react';

interface ExtendedOrderData extends OrderData {
  status?: 'paid' | 'unpaid';
  cookStatus?: 'pending' | 'preparing' | 'ready' | 'delivered';
  sharedToCook?: boolean;
}

interface DashboardStats {
  totalRevenue: number;
  totalCustomers: number;
  balanceToPayCustomer: number;
  pendingCooking: number;
}

export default function OverviewPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalCustomers: 0,
    balanceToPayCustomer: 0,
    pendingCooking: 0
  });
  const [recentOrders, setRecentOrders] = useState<ExtendedOrderData[]>([]);
  const [loading, setLoading] = useState(true);

  const { t, language } = useLanguage();

  // Format currency based on language
  const formatCurrency = (amount: number) => {
    if (language === 'en') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(amount) + ' OMR';
    } else {
      return new Intl.NumberFormat('ar-OM', {
        style: 'currency',
        currency: 'OMR',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(amount);
    }
  };

  // Calculate dashboard statistics based on Firebase data structure
  const calculateStats = (orders: ExtendedOrderData[]): DashboardStats => {
    let totalRevenue = 0;
    let balanceToPayCustomer = 0;
    let pendingCooking = 0;
    const uniqueCustomers = new Set<string>();

    // eslint-disable-next-line no-console
    console.log(`📊 Calculating stats from ${orders.length} orders...`);

    orders.forEach(order => {
      // Count unique customers (using phone number as unique identifier)
      if (order.phoneNumber) {
        uniqueCustomers.add(order.phoneNumber);
      }

      // Calculate Total Revenue from paid orders
      if (order.status === 'paid') {
        const totalPayment = parseFloat(order.totalPayment || '0');
        const discount = parseFloat(order.discount || '0');
        const finalTotal = totalPayment - discount;
        totalRevenue += finalTotal;
        // eslint-disable-next-line no-console
        console.log(`💰 Revenue from order ${order.orderId}: ${finalTotal} OMR`);
      }

      // Calculate Balance to Pay Customer (from unpaid orders)
      if (order.status === 'unpaid') {
        const balancePayment = parseFloat(order.balancePayment || '0');
        balanceToPayCustomer += balancePayment;
        // eslint-disable-next-line no-console
        console.log(`💳 Balance pending from order ${order.orderId}: ${balancePayment} OMR`);
      }

      // Count Pending Cooking orders
      if (order.cookStatus === 'pending' || order.cookStatus === 'preparing') {
        pendingCooking++;
        // eslint-disable-next-line no-console
        console.log(`👨‍🍳 Pending cooking order: ${order.orderId} (${order.cookStatus})`);
      }
    });

    const calculatedStats = {
      totalRevenue,
      totalCustomers: uniqueCustomers.size,
      balanceToPayCustomer,
      pendingCooking
    };


    return calculatedStats;
  };

  // Get recent orders (last 5)
  const getRecentOrders = (orders: ExtendedOrderData[]): ExtendedOrderData[] => {
    return orders
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date);
        const dateB = new Date(b.createdAt || b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  };

  // Fetch orders and calculate stats from Firebase
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);


      
      // Fetch all orders from Firebase
      const orders = await orderService.getAllOrders();

      
      // Add default values if not present
      const ordersWithDefaults = orders.map(order => ({
        ...order,
        status: order.status || 'unpaid',
        cookStatus: order.cookStatus || 'pending',
        sharedToCook: order.sharedToCook || false,
        discount: order.discount || '0',
        balancePayment: order.balancePayment || '0'
      })) as ExtendedOrderData[];

      const calculatedStats = calculateStats(ordersWithDefaults);
      const recent = getRecentOrders(ordersWithDefaults);
      
      setStats(calculatedStats);
      setRecentOrders(recent);

      
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('❌ Error fetching dashboard stats from Firebase:', error);
      // Set default stats on error
      setStats({
        totalRevenue: 0,
        totalCustomers: 0,
        balanceToPayCustomer: 0,
        pendingCooking: 0
      });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch from Firebase

    fetchStats();
    
    // Auto-refresh every 30 seconds to get real-time updates
    const interval = setInterval(() => {

      fetchStats();
    }, 30000);
    
    return () => {

      clearInterval(interval);
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-2'>
          <div className='flex items-center justify-between space-y-2'>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('dashboard.welcome')}
            </h2>
          </div>
          <div className='flex items-center justify-center h-64'>
            <div className='flex flex-col items-center gap-2'>
              <IconLoader className='h-8 w-8 animate-spin' />
              <p className='text-sm text-muted-foreground'>{t('loading')}</p>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {t('dashboard.welcome')}
          </h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          
          {/* Total Revenue */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>{t('dashboard.totalRevenue')}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatCurrency(stats.totalRevenue)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconCash className="h-3 w-3 mr-1" />
                  {t('dashboard.paidOrders')}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {t('dashboard.revenueFromPaidOrders')} <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                {t('dashboard.sumOfTotalPaymentDiscount')}
              </div>
            </CardFooter>
          </Card>

          {/* Total Customers */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>{t('dashboard.totalCustomers')}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {stats.totalCustomers}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUsers className="h-3 w-3 mr-1" />
                  {t('dashboard.unique')}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {t('dashboard.uniqueCustomers')} <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                {t('dashboard.basedOnUniquePhoneNumbers')}
              </div>
            </CardFooter>
          </Card>

          {/* Balance to Pay Customer */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>{t('dashboard.balanceToPayCustomer')}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {formatCurrency(stats.balanceToPayCustomer)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconCreditCard className="h-3 w-3 mr-1" />
                  {t('dashboard.pending')}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {t('dashboard.outstandingBalance')} <IconTrendingDown className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                {t('dashboard.amountPendingFromUnpaidOrders')}
              </div>
            </CardFooter>
          </Card>

          {/* Pending Cooking */}
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>{t('dashboard.pendingCooking')}</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {stats.pendingCooking}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconChefHat className="h-3 w-3 mr-1" />
                  {t('dashboard.kitchen')}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                {t('dashboard.ordersInKitchen')} <IconTrendingUp className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                {t('dashboard.ordersWithStatusPendingOrPreparing')}
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Recent Orders */}
        <div className='grid grid-cols-1 gap-4 mt-6'>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📋 {t('dashboard.recentOrders')}
                <Badge variant="outline">{recentOrders.length}</Badge>
              </CardTitle>
              <CardDescription>
                {t('dashboard.latestOrders')}
              </CardDescription>
            </CardHeader>
            <CardFooter className='p-0'>
              {recentOrders.length === 0 ? (
                <div className='p-6 text-center text-muted-foreground'>
                  {t('dashboard.noOrdersFound')}
                </div>
              ) : (
                <div className='w-full'>
                  {recentOrders.map((order, index) => (
                    <div key={order.orderId} className={`p-4 border-b last:border-b-0 ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                      <div className='flex items-center justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium'>{order.name}</span>
                            <Badge variant={order.status === 'paid' ? 'default' : 'destructive'} className='text-xs'>
                              {order.status === 'paid' ? t('status.paid') : t('status.unpaid')}
                            </Badge>
                            <Badge variant="outline" className='text-xs'>
                              {t(`status.${order.cookStatus}`)}
                            </Badge>
                          </div>
                          <div className='text-sm text-muted-foreground mt-1'>
                            {order.orderDetails.length > 50 ? order.orderDetails.substring(0, 50) + '...' : order.orderDetails}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
                            📞 {order.phoneNumber} • 📅 {order.date} {order.time}
                          </div>
                        </div>
                        <div className='text-right'>
                          <div className='font-semibold'>{formatCurrency(parseFloat(order.totalPayment) - parseFloat(order.discount || '0'))}</div>
                          <div className='text-xs text-muted-foreground'>#{order.receiptNo}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}