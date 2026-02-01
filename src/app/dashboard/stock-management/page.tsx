'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { stockService, CateringItem, CateringTransaction } from '@/services/stockService';
import { Icons } from '@/components/icons';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

export default function StockDashboardPage() {
  const [items, setItems] = useState<CateringItem[]>([]);
  const [stockSnapshot, setStockSnapshot] = useState<Record<string, number>>({});
  const [todaysTransactions, setTodaysTransactions] = useState<CateringTransaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<CateringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allItems, snapshot, transactions] = await Promise.all([
          stockService.getAllItems(),
          stockService.getStockSnapshot(),
          stockService.getTransactions()
        ]);
        
        const today = new Date().toISOString().split('T')[0];
        
        setItems(allItems);
        setStockSnapshot(snapshot);
        setTodaysTransactions(transactions.filter(t => t.date === today));
        setRecentTransactions(transactions.slice(0, 10)); // Top 10 recent
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <PageContainer><div className="flex h-full items-center justify-center p-8 text-muted-foreground">Loading dashboard...</div></PageContainer>;
  }

  // Calculate Metrics
  const lowStockItems = items.filter(item => {
    const current = stockSnapshot[item.id] || 0;
    return current <= (item.minStock || 0);
  });

  const todaysConsumption = todaysTransactions
    .filter(t => t.type === 'OUT')
    .reduce((acc, t) => acc + t.quantity, 0);
    
  const todaysReceiving = todaysTransactions
    .filter(t => t.type === 'IN')
    .reduce((acc, t) => acc + t.quantity, 0);

  // Category Breakdown
  const categoryStats = items.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-6">
        <div className="flex items-center justify-between">
            <Heading title="Stock Dashboard" description="Real-time catering stock overview" />
        </div>
        <Separator />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Icons.package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
              <p className="text-xs text-muted-foreground">Active master items</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <Icons.warning className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Consumption</CardTitle>
              <Icons.minus className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysConsumption}</div>
              <p className="text-xs text-muted-foreground">Units consumed</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Receiving</CardTitle>
              <Icons.add className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaysReceiving}</div>
              <p className="text-xs text-muted-foreground">Units received</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest stock transactions</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[350px] pr-4">
                  {recentTransactions.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No recent activity.</div>
                  ) : (
                      <div className="space-y-4">
                          {recentTransactions.map(t => (
                              <div key={t.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                  <div className="space-y-1">
                                      <p className="text-sm font-medium leading-none">{t.itemName}</p>
                                      <p className="text-xs text-muted-foreground">
                                          {format(new Date(t.date), 'MMM dd')} • {t.type === 'IN' ? 'Received' : t.type === 'OUT' ? 'Consumed' : 'Adjustment'}
                                          {t.remarks && ` • ${t.remarks}`}
                                      </p>
                                  </div>
                                  <div className={`text-sm font-bold ${
                                      t.type === 'IN' ? 'text-green-600' : 
                                      t.type === 'OUT' ? 'text-orange-600' : 'text-blue-600'
                                  }`}>
                                      {t.type === 'IN' ? '+' : '-'}{t.quantity} {t.unit}
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
                </ScrollArea>
            </CardContent>
          </Card>
          
          <Card className="col-span-3 shadow-sm">
             <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Urgent replenishment needed</CardDescription>
            </CardHeader>
            <CardContent>
                 <ScrollArea className="h-[350px] pr-4">
                    {lowStockItems.length === 0 ? (
                         <div className="flex h-full items-center justify-center text-sm text-muted-foreground">All stock levels are healthy.</div>
                    ) : (
                        <div className="space-y-6">
                            {lowStockItems.map(item => {
                                 const current = stockSnapshot[item.id] || 0;
                                 const percentage = Math.min((current / (item.minStock * 2)) * 100, 100); // Visual scale
                                 
                                 return (
                                     <div key={item.id} className="space-y-2">
                                         <div className="flex items-center justify-between text-sm">
                                             <div>
                                                <span className="font-medium">{item.name}</span>
                                                <span className="ml-2 text-xs text-muted-foreground">{item.nameAr}</span>
                                             </div>
                                             <span className="text-red-500 font-bold">{current} / {item.minStock} {item.unit}</span>
                                         </div>
                                         <Progress value={percentage} className="h-2" />
                                     </div>
                                 );
                            })}
                        </div>
                    )}
                 </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
