'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { financeService, CreditCustomer, IncomeRecord, ManualCredit } from '@/services/financeService';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconCreditCard, IconUsers, IconCalendar, IconFileText, IconAlertCircle } from '@tabler/icons-react';

export default function CreditCustomersPage() {
  const [customers, setCustomers] = useState<CreditCustomer[]>([]);
  const [manualCredits, setManualCredits] = useState<ManualCredit[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const [selectedOrder, setSelectedOrder] = useState<IncomeRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [newCredit, setNewCredit] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    customerName: '',
    phoneNumber: '',
    amount: '',
    notes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const customerData = await financeService.getCreditCustomers();
      setCustomers(customerData);

      const credits = await financeService.getManualCredits(parseISO(startDate), parseISO(endDate));
      setManualCredits(credits);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load credit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const openPaymentDialog = (order: IncomeRecord) => {
    setSelectedOrder(order);
    setPaymentAmount(order.balanceAmount);
    setIsPaymentDialogOpen(true);
  };

  const handlePayment = async () => {
    if (!selectedOrder || paymentAmount <= 0) return;
    
    try {
      await financeService.recordPayment(selectedOrder.orderId, paymentAmount);
      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record payment');
    }
  };

  const handleAddCredit = async () => {
    if (!newCredit.customerName || !newCredit.amount) {
      toast.error("Name and Amount are required");
      return;
    }
    try {
      await financeService.addManualCredit({
        date: newCredit.date,
        customerName: newCredit.customerName,
        phoneNumber: newCredit.phoneNumber,
        amount: parseFloat(newCredit.amount),
        notes: newCredit.notes
      });
      toast.success("Credit entry added");
      setIsCreditDialogOpen(false);
      setNewCredit({
        date: format(new Date(), 'yyyy-MM-dd'),
        customerName: '',
        phoneNumber: '',
        amount: '',
        notes: ''
      });
      loadData();
    } catch (e) {
      console.error(e);
      toast.error("Failed to add credit");
    }
  };

  const generateBill = async (customer: CreditCustomer) => {
    toast.info(`Generating bill for ${customer.name}...`);
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("ALMAKAREM KITCHEN", 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text("Customer Bill / Statement", 105, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Customer: ${customer.name}`, 14, 40);
      doc.text(`Phone: ${customer.phoneNumber}`, 14, 45);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 50);

      const head = [['Date', 'Ref/Order', 'Total Amount', 'Paid', 'Balance']];
      const body = [
        ...customer.orders.map(o => [
          o.date,
          `Order #${o.orderId.slice(-6)}`,
          o.totalAmount.toFixed(3),
          o.paidAmount.toFixed(3),
          o.balanceAmount.toFixed(3)
        ]),
        ...customer.manualCredits.map(c => [
          c.date,
          `Manual Credit: ${c.notes || ''}`,
          c.amount.toFixed(3),
          '0.000',
          c.amount.toFixed(3)
        ])
      ];

      body.sort((a, b) => new Date(a[0] as string).getTime() - new Date(b[0] as string).getTime());

      autoTable(doc, {
        head: head,
        body: body,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 60;
      doc.setFontSize(10);
      doc.text(`Total Outstanding Balance: ${customer.outstandingBalance.toFixed(3)} OMR`, 14, finalY + 10);

      doc.save(`Bill-${customer.name}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Bill generated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate bill");
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Credit Management</h1>
            <p className="text-muted-foreground mt-2">Track customer credit balances and payments</p>
          </div>
          <Button onClick={() => setIsCreditDialogOpen(true)} size="lg">
            <Icons.add className="mr-2 h-5 w-5" /> Add Manual Credit
          </Button>
        </div>

        {/* Total Outstanding Alert */}
        <Card className="mb-8 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <IconAlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Total Outstanding Balance</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">Across all credit customers</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-4xl font-bold text-red-900 dark:text-red-100">{totalOutstanding.toFixed(3)}</span>
                <span className="text-xl text-red-700 dark:text-red-300 ml-2">OMR</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
              <IconUsers className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{customers.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Active credit accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
              <IconCreditCard className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {customers.reduce((sum, c) => sum + c.orders.length + c.manualCredits.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Orders and manual credits
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Balance</CardTitle>
              <IconFileText className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {customers.length > 0 ? (totalOutstanding / customers.length).toFixed(3) : '0.000'}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                OMR per customer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="balances" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6">
            <TabsTrigger value="balances" className="gap-2">
              <IconUsers className="h-4 w-4" /> Customer Balances
            </TabsTrigger>
            <TabsTrigger value="monthly" className="gap-2">
              <IconCalendar className="h-4 w-4" /> Monthly Credit Log
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="balances" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground">Loading credit customers...</p>
                  </div>
                </CardContent>
              </Card>
            ) : customers.length === 0 ? (
              <Card>
                <CardContent className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <IconUsers className="h-12 w-12 text-muted-foreground/30" />
                    <div className="text-center">
                      <p className="font-medium text-muted-foreground">No credit customers found</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">Credit customers will appear here when orders are placed on credit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-3">
                {customers.map((customer, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="hover:no-underline px-6 py-4">
                      <div className="flex flex-1 items-center justify-between mr-4">
                        <div className="text-left flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <IconUsers className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phoneNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Outstanding</p>
                          <p className="font-bold text-2xl text-red-600">{customer.outstandingBalance.toFixed(3)} OMR</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="px-6 pb-6 pt-2">
                        <div className="flex justify-end mb-4">
                          <Button size="sm" variant="outline" onClick={() => generateBill(customer)}>
                            <IconFileText className="mr-2 h-4 w-4" /> Generate Statement PDF
                          </Button>
                        </div>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="font-semibold">Date</TableHead>
                                <TableHead className="font-semibold">Details</TableHead>
                                <TableHead className="text-right font-semibold">Total</TableHead>
                                <TableHead className="text-right font-semibold">Paid</TableHead>
                                <TableHead className="text-right font-semibold">Balance</TableHead>
                                <TableHead className="text-right font-semibold">Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customer.orders.map(order => (
                                <TableRow key={order.orderId} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="font-medium">{order.date}</TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                      Order #{order.orderId.slice(-6)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">{order.totalAmount.toFixed(3)}</TableCell>
                                  <TableCell className="text-right text-green-600">{order.paidAmount.toFixed(3)}</TableCell>
                                  <TableCell className="text-right">
                                    <span className="font-bold text-lg text-red-600">{order.balanceAmount.toFixed(3)}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button size="sm" onClick={() => openPaymentDialog(order)} className="bg-green-600 hover:bg-green-700">
                                      Pay Now
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                              {customer.manualCredits.map(credit => (
                                <TableRow key={credit.id} className="hover:bg-muted/50 transition-colors">
                                  <TableCell className="font-medium">{credit.date}</TableCell>
                                  <TableCell>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                      Manual: {credit.notes}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">{credit.amount.toFixed(3)}</TableCell>
                                  <TableCell className="text-right text-muted-foreground">0.000</TableCell>
                                  <TableCell className="text-right">
                                    <span className="font-bold text-lg text-red-600">{credit.amount.toFixed(3)}</span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <span className="text-xs text-muted-foreground italic">Bill Only</span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <Card className="shadow-sm">
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
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <IconCalendar className="h-4 w-4" /> End Date
                    </Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium opacity-0">Action</Label>
                    <Button variant="outline" onClick={loadData} className="w-full">
                      <Icons.refresh className="h-4 w-4 mr-2" /> Refresh Log
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/50">
                <CardTitle className="text-lg">Credit Log Entries</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Customer</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="text-right font-semibold">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const allCredits = [
                          ...customers.flatMap(c => c.orders.filter(o => {
                            return o.balanceAmount > 0 && o.date >= startDate && o.date <= endDate;
                          }).map(o => ({
                            date: o.date,
                            name: c.name,
                            type: 'Order Credit',
                            amount: o.balanceAmount
                          }))),
                          ...manualCredits.map(c => ({
                            date: c.date,
                            name: c.customerName,
                            type: 'Manual Credit',
                            amount: c.amount
                          }))
                        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                        return allCredits.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center h-40">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <IconFileText className="h-12 w-12 text-muted-foreground/30" />
                                <div>
                                  <p className="font-medium text-muted-foreground">No credit records found</p>
                                  <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your date range</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          allCredits.map((item, i) => (
                            <TableRow key={i} className="hover:bg-muted/50 transition-colors">
                              <TableCell className="font-medium">{item.date}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                  item.type === 'Order Credit' 
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                                    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                }`}>
                                  {item.type}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="font-bold text-lg">{item.amount.toFixed(3)}</span>
                                <span className="text-muted-foreground ml-1">OMR</span>
                              </TableCell>
                            </TableRow>
                          ))
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Customer</Label>
                <Input value={selectedOrder?.customerName} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Order Balance</Label>
                <Input value={selectedOrder?.balanceAmount.toFixed(3) + ' OMR'} disabled className="bg-muted font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Amount Paying Now</Label>
                <Input 
                  type="number" 
                  step="0.001" 
                  placeholder="0.000"
                  value={paymentAmount} 
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value))} 
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handlePayment} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                Confirm Payment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Credit Dialog */}
        <Dialog open={isCreditDialogOpen} onOpenChange={setIsCreditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Add Manual Credit Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date</Label>
                <Input type="date" value={newCredit.date} onChange={(e) => setNewCredit({...newCredit, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Customer Name</Label>
                <Input placeholder="Enter customer name" value={newCredit.customerName} onChange={(e) => setNewCredit({...newCredit, customerName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Phone Number</Label>
                <Input placeholder="Enter phone number" value={newCredit.phoneNumber} onChange={(e) => setNewCredit({...newCredit, phoneNumber: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Credit Amount (OMR)</Label>
                <Input type="number" step="0.001" placeholder="0.000" value={newCredit.amount} onChange={(e) => setNewCredit({...newCredit, amount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Input placeholder="Additional details" value={newCredit.notes} onChange={(e) => setNewCredit({...newCredit, notes: e.target.value})} />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsCreditDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddCredit} className="w-full sm:w-auto">
                Save Credit Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}