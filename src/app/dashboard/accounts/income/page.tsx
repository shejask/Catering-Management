'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { financeService, IncomeRecord, CounterSale } from '@/services/financeService';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconCurrencyDollar, IconShoppingCart, IconCash, IconCalendar, IconTrendingUp } from '@tabler/icons-react';

export default function IncomePage() {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  const [orderRecords, setOrderRecords] = useState<IncomeRecord[]>([]);
  const [counterSales, setCounterSales] = useState<CounterSale[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const [orders, sales] = await Promise.all([
        financeService.getIncomeRecords(start, end),
        financeService.getCounterSales(start, end)
      ]);
      setOrderRecords(orders);
      setCounterSales(sales);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load income data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const handleAddCounterSale = async () => {
    if (!newSale.amount || parseFloat(newSale.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      await financeService.addCounterSale({
        date: newSale.date,
        amount: parseFloat(newSale.amount),
        notes: newSale.notes
      });
      toast.success("Counter sale added");
      setIsDialogOpen(false);
      setNewSale({ date: format(new Date(), 'yyyy-MM-dd'), amount: '', notes: '' });
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add counter sale");
    }
  };

  const handleDeleteCounterSale = async (id: string) => {
    if (confirm("Delete this counter sale entry?")) {
      try {
        await financeService.deleteCounterSale(id);
        toast.success("Entry deleted");
        loadData();
      } catch (e) {
        console.error(e);
        toast.error("Failed to delete");
      }
    }
  };

  // Aggregate data by Date
  const dailyData = new Map<string, { orderTotal: number; counterTotal: number; counterSales: CounterSale[] }>();

  orderRecords.forEach(r => {
    if (!dailyData.has(r.date)) dailyData.set(r.date, { orderTotal: 0, counterTotal: 0, counterSales: [] });
    dailyData.get(r.date)!.orderTotal += r.totalAmount;
  });

  counterSales.forEach(s => {
    if (!dailyData.has(s.date)) dailyData.set(s.date, { orderTotal: 0, counterTotal: 0, counterSales: [] });
    dailyData.get(s.date)!.counterTotal += s.amount;
    dailyData.get(s.date)!.counterSales.push(s);
  });

  const sortedDates = Array.from(dailyData.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const totalOrderIncome = orderRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalCounterIncome = counterSales.reduce((sum, s) => sum + s.amount, 0);
  const totalIncome = totalOrderIncome + totalCounterIncome;

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Income Management</h1>
            <p className="text-muted-foreground mt-2">Track and manage your daily revenue streams</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} size="lg">
            <Icons.add className="mr-2 h-5 w-5" /> Add Counter Sale
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-sm">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconCalendar className="h-5 w-5" /> Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <IconCalendar className="h-4 w-4" /> Start Date
                </Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full" />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <IconCalendar className="h-4 w-4" /> End Date
                </Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium opacity-0">Action</Label>
                <Button variant="outline" onClick={loadData} className="w-full">
                  <Icons.refresh className="h-4 w-4 mr-2" /> Refresh Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Order Sales</CardTitle>
              <IconShoppingCart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrderIncome.toFixed(3)} OMR</div>
              <p className="text-xs text-muted-foreground mt-2">
                Automated from orders
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Counter Sales</CardTitle>
              <IconCash className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalCounterIncome.toFixed(3)} OMR</div>
              <p className="text-xs text-muted-foreground mt-2">
                Manually entered
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Total Income</CardTitle>
              <IconTrendingUp className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{totalIncome.toFixed(3)} OMR</div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                Gross revenue
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Daily Average</CardTitle>
              <IconCurrencyDollar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {sortedDates.length > 0 ? (totalIncome / sortedDates.length).toFixed(3) : '0.000'} OMR
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Per day average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Income Table */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="text-lg">Daily Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="text-right font-semibold">Counter Sale (Cash)</TableHead>
                    <TableHead className="text-right font-semibold">Order Sale</TableHead>
                    <TableHead className="text-right font-semibold">Total Daily Income</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-32">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">Loading income data...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : sortedDates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-40">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <IconCurrencyDollar className="h-12 w-12 text-muted-foreground/30" />
                          <div>
                            <p className="font-medium text-muted-foreground">No income records found</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your date range or add a counter sale</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedDates.map(date => {
                      const data = dailyData.get(date)!;
                      const total = data.counterTotal + data.orderTotal;
                      return (
                        <TableRow key={date} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-medium">{date}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-lg text-blue-600">{data.counterTotal.toFixed(3)}</span>
                              <span className="text-muted-foreground text-xs">OMR</span>
                              {data.counterSales.length > 0 && (
                                <div className="mt-1 space-y-0.5">
                                  {data.counterSales.map(s => s.notes).filter(Boolean).map((note, idx) => (
                                    <span key={idx} className="block text-[10px] text-muted-foreground/80 italic">
                                      {note}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-lg">{data.orderTotal.toFixed(3)}</span>
                              <span className="text-muted-foreground text-xs">OMR</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-bold text-xl text-green-700 dark:text-green-400">{total.toFixed(3)}</span>
                              <span className="text-green-600 dark:text-green-500 text-xs font-medium">OMR</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {data.counterSales.map(s => (
                                <Button 
                                  key={s.id} 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 hover:bg-red-50 hover:text-red-600" 
                                  onClick={() => handleDeleteCounterSale(s.id)}
                                  title="Delete counter sale"
                                >
                                  <Icons.trash className="h-4 w-4" />
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Counter Sale Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Add Daily Counter Sale</DialogTitle>
            </DialogHeader>
            <div className="grid gap-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Input 
                  type="date" 
                  value={newSale.date} 
                  onChange={(e) => setNewSale({...newSale, date: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount (OMR)</Label>
                <Input 
                  type="number" 
                  step="0.001" 
                  placeholder="0.000"
                  value={newSale.amount} 
                  onChange={(e) => setNewSale({...newSale, amount: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes (Optional)</Label>
                <Input 
                  placeholder="e.g. Walk-in cash, Counter payment" 
                  value={newSale.notes} 
                  onChange={(e) => setNewSale({...newSale, notes: e.target.value})} 
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddCounterSale} className="w-full sm:w-auto">
                Save Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}