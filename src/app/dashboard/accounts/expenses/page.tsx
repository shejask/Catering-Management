'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { financeService, Expense } from '@/services/financeService';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { EXPENSE_CATEGORIES } from '@/constants/accounts';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconCurrencyDollar, IconReceipt, IconCalendar, IconFilter } from '@tabler/icons-react';

const expenseSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  description: z.string().optional(),
  amount: z.coerce.number().min(0.001, 'Amount must be greater than 0'),
  paymentMode: z.enum(['cash', 'bank', 'upi']),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      subCategory: '',
      description: '',
      amount: 0,
      paymentMode: 'cash',
    },
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await financeService.getExpenses(parseISO(startDate), parseISO(endDate));
      setExpenses(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [startDate, endDate]);

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const payload = {
        ...data,
        description: data.description || '',
        subCategory: data.subCategory || ''
      };

      if (editingId) {
        await financeService.updateExpense(editingId, payload);
        toast.success('Expense updated');
      } else {
        await financeService.addExpense(payload);
        toast.success('Expense added');
      }
      setIsDialogOpen(false);
      resetForm();
      loadExpenses();
    } catch (error) {
      console.error(error);
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    form.reset({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      subCategory: '',
      description: '',
      amount: 0,
      paymentMode: 'cash',
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    form.reset({
      date: expense.date,
      category: expense.category,
      subCategory: expense.subCategory,
      description: expense.description,
      amount: expense.amount,
      paymentMode: expense.paymentMode,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await financeService.deleteExpense(id);
        toast.success('Expense deleted');
        loadExpenses();
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete expense');
      }
    }
  };

  const filteredExpenses = categoryFilter === 'all' 
    ? expenses 
    : expenses.filter(e => e.category === categoryFilter);

  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Daily Expenses</h1>
            <p className="text-muted-foreground mt-2">Manage and track your daily expenditures</p>
          </div>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="lg">
            <Icons.add className="mr-2 h-5 w-5" /> Add Expense
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <IconCurrencyDollar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{totalAmount.toFixed(3)} OMR</div>
              <p className="text-xs text-muted-foreground mt-2">
                {filteredExpenses.length} transactions
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
              <IconReceipt className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{filteredExpenses.length}</div>
              <p className="text-xs text-muted-foreground mt-2">
                In selected period
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Expense</CardTitle>
              <IconCurrencyDollar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {filteredExpenses.length > 0 ? (totalAmount / filteredExpenses.length).toFixed(3) : '0.000'} OMR
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Per transaction
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Date Range</CardTitle>
              <IconCalendar className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {format(parseISO(startDate), 'MMM d')} - {format(parseISO(endDate), 'MMM d, yyyy')}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Selected period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-sm">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconFilter className="h-5 w-5" /> Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Label className="text-sm font-medium">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[250px]">
                      <SelectItem value="all">All Categories</SelectItem>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium opacity-0">Action</Label>
                <Button variant="outline" onClick={loadExpenses} className="w-full">
                  <Icons.refresh className="h-4 w-4 mr-2" /> Refresh Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="text-lg">Expense Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Sub-Category</TableHead>
                    <TableHead className="font-semibold">Notes</TableHead>
                    <TableHead className="font-semibold">Payment Mode</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-32">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <p className="text-muted-foreground">Loading expenses...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredExpenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-40">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <IconReceipt className="h-12 w-12 text-muted-foreground/30" />
                          <div>
                            <p className="font-medium text-muted-foreground">No expenses found</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters or add a new expense</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExpenses.map((expense) => (
                      <TableRow key={expense.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{expense.date}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                            {expense.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{expense.subCategory || '—'}</TableCell>
                        <TableCell className="max-w-[250px] truncate text-muted-foreground" title={expense.description}>
                          {expense.description || '—'}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            expense.paymentMode === 'cash' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            expense.paymentMode === 'bank' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          }`}>
                            {expense.paymentMode.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg">{expense.amount.toFixed(3)}</span>
                          <span className="text-muted-foreground ml-1">OMR</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)} className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600">
                              <Icons.edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="h-9 w-9 hover:bg-red-50 hover:text-red-600">
                              <Icons.trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">{editingId ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paymentMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Mode</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select mode" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank">Bank Transfer</SelectItem>
                            <SelectItem value="upi">UPI / Wallet</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <ScrollArea className="h-[250px]">
                            {EXPENSE_CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="subCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sub-Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Vegetables, Fuel, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (OMR)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.001" placeholder="0.000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Additional details or description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="w-full sm:w-auto">
                    {editingId ? 'Update Expense' : 'Save Expense'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}