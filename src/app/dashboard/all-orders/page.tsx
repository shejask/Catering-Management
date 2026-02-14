'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLanguage } from '@/contexts/language-context';
import { orderService, type OrderData } from '@/services/orderService';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  IconDotsVertical, 
  IconEye, 
  IconEdit, 
  IconTrash, 
  IconChefHat,
  IconRefresh,
  IconFilter,
  IconDownload,
  IconX
} from '@tabler/icons-react';

interface ExtendedOrderData extends OrderData {
  status?: 'paid' | 'unpaid';
  cookStatus?: 'pending' | 'preparing' | 'ready' | 'delivered';
  sharedToCook?: boolean;
}

// Form schema for editing orders
const editOrderSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  receiptNo: z.string().min(1, 'Receipt number is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  orderDetails: z.string().min(1, 'Order details are required'),
  totalPayment: z.string().min(1, 'Total payment is required'),
  advancePayment: z.string().min(1, 'Advance payment is required'),
  balancePayment: z.string().min(0, 'Balance payment must be positive'),
  discount: z.string().min(0, 'Discount must be positive'),
  location: z.string().min(1, 'Location is required'),
  paymentType: z.enum(['cash', 'atm', 'transfer']),
  deliveryType: z.string().min(1, 'Delivery type is required'),
  status: z.enum(['paid', 'unpaid']),
  cookStatus: z.enum(['pending', 'preparing', 'ready', 'delivered'])
});

type EditFormData = z.infer<typeof editOrderSchema>;

// Export form schema
const exportSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
});

type ExportFormData = z.infer<typeof exportSchema>;

export default function AllOrdersPage() {
  const [orders, setOrders] = useState<ExtendedOrderData[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<ExtendedOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrderData | null>(null);
  const [editingOrder, setEditingOrder] = useState<ExtendedOrderData | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [cookStatusFilter, setCookStatusFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'delivered'>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  
  const { t, language } = useLanguage();

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editOrderSchema),
    defaultValues: {
      name: '',
      receiptNo: '',
      date: '',
      time: '',
      phoneNumber: '',
      orderDetails: '',
      totalPayment: '',
      advancePayment: '',
      balancePayment: '0',
      discount: '0',
      location: '',
      paymentType: 'cash',
      deliveryType: '',
      status: 'unpaid',
      cookStatus: 'pending'
    }
  });

  const exportForm = useForm<ExportFormData>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      startDate: '',
      endDate: new Date().toISOString().split('T')[0]
    }
  });

  // Format currency in Omani Riyal based on language
  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (language === 'en') {
      // English format: show as "122.000 OMR"
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(numAmount || 0) + ' OMR';
    } else {
      // Arabic format: show as "‏٢٬١٢٢٫٠٠٠ ر.ع."
      return new Intl.NumberFormat('ar-OM', {
        style: 'currency',
        currency: 'OMR',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(numAmount || 0);
    }
  };

  // Calculate total based on totalPayment and discount
  const calculateFinalTotal = (totalPayment: string, discount: string) => {
    const total = parseFloat(totalPayment) || 0;
    const discountAmount = parseFloat(discount) || 0;
    return (total - discountAmount);
  };

  // Calculate balance payment
  const calculateBalance = (totalPayment: string, advancePayment: string, discount: string) => {
    const total = parseFloat(totalPayment) || 0;
    const advance = parseFloat(advancePayment) || 0;
    const discountAmount = parseFloat(discount) || 0;
    const finalTotal = total - discountAmount;
    return Math.max(0, finalTotal - advance);
  };

  // Filter orders based on selected filters
  const applyFilters = useMemo(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply cook status filter
    if (cookStatusFilter !== 'all') {
      filtered = filtered.filter(order => order.cookStatus === cookStatusFilter);
    }

    // Apply date range filter
    if (startDateFilter || endDateFilter) {
      if (startDateFilter && endDateFilter) {
        // Both dates selected - filter by range (only if start <= end)
        if (startDateFilter <= endDateFilter) {
          const start = new Date(startDateFilter);
          const end = new Date(endDateFilter);
          end.setHours(23, 59, 59, 999); // Include the entire end date

          filtered = filtered.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= start && orderDate <= end;
          });
        }
        // If start > end, don't apply filter (invalid range)
      } else if (startDateFilter) {
        // Only start date selected - filter from start date onwards
        const start = new Date(startDateFilter);
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate >= start;
        });
      } else if (endDateFilter) {
        // Only end date selected - filter up to end date
        const end = new Date(endDateFilter);
        end.setHours(23, 59, 59, 999); // Include the entire end date
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.date);
          return orderDate <= end;
        });
      }
    }

    return filtered;
  }, [orders, statusFilter, cookStatusFilter, startDateFilter, endDateFilter]);

  // Update filtered orders when filters change
  useEffect(() => {
    setFilteredOrders(applyFilters);
  }, [applyFilters]);

  // Export to PDF function
  const exportToPDF = (data: ExtendedOrderData[]) => {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup blocked. Please allow popups and try again.');
      return;
    }

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Orders Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .header h1 { margin: 0; color: #333; }
            .header p { margin: 5px 0; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .summary { margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
            .summary h3 { margin-top: 0; color: #333; }
            .summary p { margin: 5px 0; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Al Makarem Catering</h1>
            <p>Orders Report</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>Date Range: ${startDateFilter || 'All'} to ${endDateFilter || 'All'}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Total Orders:</strong> ${data.length}</p>
            <p><strong>Total Revenue:</strong> ${formatCurrency(data.reduce((sum, order) => sum + calculateFinalTotal(order.totalPayment, order.discount || '0'), 0))}</p>
            <p><strong>Paid Orders:</strong> ${data.filter(order => order.status === 'paid').length}</p>
            <p><strong>Unpaid Orders:</strong> ${data.filter(order => order.status === 'unpaid').length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Order Details</th>
                <th>Total (OMR)</th>
                <th>Discount</th>
                <th>Final Total</th>
                <th>Advance</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Cook Status</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(order => {
                const finalTotal = calculateFinalTotal(order.totalPayment, order.discount || '0');
                const balance = calculateBalance(order.totalPayment, order.advancePayment, order.discount || '0');
                return `
                  <tr>
                    <td>${order.receiptNo}</td>
                    <td>${order.name}</td>
                    <td>${order.phoneNumber}</td>
                    <td>${new Date(order.date).toLocaleDateString()}</td>
                    <td>${order.time}</td>
                    <td>${order.location}</td>
                    <td>${order.orderDetails}</td>
                    <td>${order.totalPayment}</td>
                    <td>${order.discount || '0'}</td>
                    <td>${finalTotal}</td>
                    <td>${order.advancePayment}</td>
                    <td>${balance}</td>
                    <td>${order.status || 'unpaid'}</td>
                    <td>${order.cookStatus || 'pending'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Print / Save as PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background-color: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Handle export with date range
  const onExportSubmit = (data: ExportFormData) => {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    const filteredData = filteredOrders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= startDate && orderDate <= endDate;
    });

    if (filteredData.length === 0) {
      toast.error('No orders found in the selected date range');
      return;
    }

    exportToPDF(filteredData);
    toast.success(`Generated ${filteredData.length} orders report as PDF`);
    setIsExportDialogOpen(false);
  };

  // Fetch all orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedOrders = await orderService.getAllOrders();
      // Add default values if not present
      const ordersWithDefaults = fetchedOrders.map(order => ({
        ...order,
        status: order.status || 'unpaid',
        cookStatus: order.cookStatus || 'pending',
        sharedToCook: order.sharedToCook || false,
        balancePayment: order.balancePayment || '0',
        discount: order.discount || '0'
      })) as ExtendedOrderData[];
      setOrders(ordersWithDefaults);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update order status
  const updateOrderStatus = async (orderId: string, status: 'paid' | 'unpaid') => {
    try {
      const orderToUpdate = orders.find(order => order.orderId === orderId);
      if (!orderToUpdate) return;

      await orderService.updateOrder(orderId, { ...orderToUpdate, status });
      
      setOrders(orders.map(order => 
        order.orderId === orderId ? { ...order, status } : order
      ));
      
      toast.success(`Order status updated to ${status}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };



  // Share order to cook
  const shareOrderToCook = async (orderId: string) => {
    try {
      const orderToUpdate = orders.find(order => order.orderId === orderId);
      if (!orderToUpdate) return;

      await orderService.updateOrder(orderId, { ...orderToUpdate, sharedToCook: true });
      
      setOrders(orders.map(order => 
        order.orderId === orderId ? { ...order, sharedToCook: true } : order
      ));
      
      toast.success('Order shared with cook successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sharing order to cook:', error);
      toast.error('Failed to share order to cook');
    }
  };

  // Delete order
  const deleteOrder = async (orderId: string) => {
    try {
      await orderService.deleteOrder(orderId);
      setOrders(orders.filter(order => order.orderId !== orderId));
      toast.success('Order deleted successfully');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    }
  };

  // View order details
  const viewOrderDetails = (order: ExtendedOrderData) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  // Edit order
  const editOrder = (order: ExtendedOrderData) => {
    setEditingOrder(order);
    editForm.reset({
      name: order.name,
      receiptNo: order.receiptNo,
      date: order.date,
      time: order.time,
      phoneNumber: order.phoneNumber,
      orderDetails: order.orderDetails,
      totalPayment: order.totalPayment,
      advancePayment: order.advancePayment,
      balancePayment: order.balancePayment || '0',
      discount: order.discount || '0',
      location: order.location,
      paymentType: order.paymentType,
      deliveryType: order.deliveryType,
      status: order.status || 'unpaid',
      cookStatus: order.cookStatus || 'pending'
    });
    setIsEditDialogOpen(true);
  };

  // Submit edit form
  const onEditSubmit = async (data: EditFormData) => {
    if (!editingOrder) return;
    
    setIsSubmitting(true);
    try {
      // Calculate balance payment automatically
      const calculatedBalance = calculateBalance(data.totalPayment, data.advancePayment, data.discount);
      
      const updatedOrder = {
        ...editingOrder,
        ...data,
        balancePayment: calculatedBalance.toString()
      };

      await orderService.updateOrder(editingOrder.orderId!, updatedOrder);
      
      setOrders(orders.map(order => 
        order.orderId === editingOrder.orderId ? updatedOrder : order
      ));
      
      toast.success('Order updated successfully');
      setIsEditDialogOpen(false);
      setEditingOrder(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get cook status badge variant
  const getCookStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'preparing': return 'default';
      case 'ready': return 'outline';
      case 'delivered': return 'default';
      default: return 'secondary';
    }
  };

  // Get cook status color
  const getCookStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600';
      case 'preparing': return 'text-blue-600';
      case 'ready': return 'text-green-600';
      case 'delivered': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setCookStatusFilter('all');
    setStartDateFilter('');
    setEndDateFilter('');
  };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Watch form values for real-time calculation
  const watchedValues = editForm.watch(['totalPayment', 'advancePayment', 'discount']);

  if (loading) {
    return (
      <PageContainer>
        <div className='flex flex-1 flex-col space-y-6'>
          <div className='flex items-center justify-between'>
            <h1 className='text-3xl font-bold tracking-tight'>{t('page.allOrders')}</h1>
          </div>
          <div className='flex items-center justify-center h-64'>
            <div className='text-lg'>{t('message.loading')}</div>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Page Header */}
        <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-4'>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>{t('page.allOrders')}</h1>
          <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2'>
            <Button onClick={fetchOrders} variant='outline' size='sm' className='w-full sm:w-auto'>
              <IconRefresh className='h-4 w-4 mr-2' />
              <span className='sm:hidden'>Refresh</span>
              <span className='hidden sm:inline'>{t('action.refresh')}</span>
            </Button>
            <Button onClick={() => setIsExportDialogOpen(true)} variant='outline' size='sm' className='w-full sm:w-auto'>
              <IconDownload className='h-4 w-4 mr-2' />
              <span className='sm:hidden'>PDF</span>
              <span className='hidden sm:inline'>Generate PDF</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <CardTitle className='flex items-center gap-2'>
                <IconFilter className='h-5 w-5' />
                {t('section.filters')}
              </CardTitle>
              {(statusFilter !== 'all' || cookStatusFilter !== 'all' || startDateFilter || endDateFilter) && (
                <Button onClick={clearFilters} variant='outline' size='sm'>
                  <IconX className='h-4 w-4 mr-2' />
                  {t('filter.clearFilters')}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
              {/* Payment Status Filter */}
              <div className='flex flex-col space-y-2'>
                <Label>{t('filter.paymentStatus')}</Label>
                <Select value={statusFilter} onValueChange={(value: 'all' | 'paid' | 'unpaid') => setStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('filter.allStatus')}</SelectItem>
                    <SelectItem value='paid'>{t('status.paid')}</SelectItem>
                    <SelectItem value='unpaid'>{t('status.unpaid')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cook Status Filter */}
              <div className='flex flex-col space-y-2'>
                <Label>{t('filter.kitchenStatus')}</Label>
                <Select value={cookStatusFilter} onValueChange={(value: 'all' | 'pending' | 'preparing' | 'ready' | 'delivered') => setCookStatusFilter(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('filter.allStatus')}</SelectItem>
                    <SelectItem value='pending'>{t('status.pending')}</SelectItem>
                    <SelectItem value='preparing'>{t('status.preparing')}</SelectItem>
                    <SelectItem value='ready'>{t('status.ready')}</SelectItem>
                    <SelectItem value='delivered'>{t('status.delivered')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className='flex flex-col space-y-2'>
                <Label>{t('filter.dateRange')}</Label>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <Input 
                      type='date' 
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      placeholder={t('filter.startDate')}
                    />
                  </div>
                  <div>
                    <Input 
                      type='date' 
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      placeholder={t('filter.endDate')}
                    />
                  </div>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Leave empty to show all orders, or select a date range to filter
                </p>
                {(startDateFilter && endDateFilter && startDateFilter > endDateFilter) && (
                  <p className='text-xs text-red-500'>
                    Start date cannot be after end date
                  </p>
                )}
                <div className='flex gap-2'>
                  <Button 
                    type='button' 
                    variant='outline' 
                    size='sm'
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setStartDateFilter(today);
                      setEndDateFilter(today);
                    }}
                  >
                    {t('filter.today')}
                  </Button>
                  <Button 
                    type='button' 
                    variant='outline' 
                    size='sm'
                    onClick={() => {
                      const today = new Date();
                      const startOfWeek = new Date(today);
                      startOfWeek.setDate(today.getDate() - today.getDay());
                      const endOfWeek = new Date(today);
                      endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
                      
                      setStartDateFilter(startOfWeek.toISOString().split('T')[0]);
                      setEndDateFilter(endOfWeek.toISOString().split('T')[0]);
                    }}
                  >
                    {t('filter.thisWeek')}
                  </Button>

                  <Button 
                    type='button' 
                    variant='outline' 
                    size='sm'
                    onClick={() => {
                      const today = new Date();
                      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                      
                      setStartDateFilter(startOfMonth.toISOString().split('T')[0]);
                      setEndDateFilter(endOfMonth.toISOString().split('T')[0]);
                    }}
                  >
                    {t('filter.thisMonth')}
                  </Button>
                  <Button 
                    type='button' 
                    variant='outline' 
                    size='sm'
                    onClick={() => {
                      setStartDateFilter('');
                      setEndDateFilter('');
                    }}
                  >
                    {t('filter.clearDates')}
                  </Button>
                </div>
              </div>

              {/* Filter Results Info */}
              <div className='flex items-end'>
                <div className='text-sm text-muted-foreground'>
                  <div>Showing {filteredOrders.length} of {orders.length} orders</div>
                  {(startDateFilter || endDateFilter) && (
                    <div className='mt-1 text-xs'>
                      Date filter: {startDateFilter || 'Any'} to {endDateFilter || 'Any'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List - Mobile Friendly */}
        <Card>
          <CardHeader>
            <CardTitle>{t('section.ordersManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className='text-center py-8'>
                <p className='text-muted-foreground'>
                  {orders.length === 0 ? t('message.noOrders') : t('message.noMatchingOrders')}
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {filteredOrders.map((order) => {
                  const finalTotal = calculateFinalTotal(order.totalPayment, order.discount || '0');
                  return (
                    <div key={order.orderId} className='border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors'>
                      <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                        {/* Order Info - Mobile Optimized */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex flex-col space-y-2 sm:flex-row sm:items-center sm:gap-3 sm:space-y-0'>
                            <div className='flex-1 min-w-0'>
                              <div className='flex flex-col space-y-1 sm:flex-row sm:items-center sm:gap-2 sm:space-y-0'>
                                <h3 className='font-semibold text-sm sm:text-base truncate'>{order.name}</h3>
                                <span className='text-xs text-muted-foreground'>#{order.receiptNo}</span>
                              </div>
                              <p className='text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1'>
                                {order.orderDetails}
                              </p>
                              <div className='flex flex-wrap gap-2 sm:gap-3 mt-2 text-xs text-muted-foreground'>
                                <span className='flex items-center'>📞 {order.phoneNumber}</span>
                                <span className='flex items-center'>📅 {new Date(order.date).toLocaleDateString()}</span>
                                <span className='flex items-center'>🕒 {order.time}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Info & Status - Mobile Optimized */}
                        <div className='flex items-center justify-between sm:gap-4'>
                          <div className='text-left sm:text-right'>
                            <div className='text-sm font-medium'>{formatCurrency(finalTotal)}</div>
                            <div className='text-xs text-muted-foreground'>
                              {t('table.advancePaid')}: {formatCurrency(order.advancePayment)}
                            </div>
                          </div>
                          
                          {/* Status Badges */}
                          <div className='flex flex-row gap-2 sm:flex-col sm:gap-1'>
                            <Badge 
                              variant={order.status === 'paid' ? 'default' : 'destructive'}
                              className='cursor-pointer text-xs'
                              onClick={() => updateOrderStatus(
                                order.orderId!, 
                                order.status === 'paid' ? 'unpaid' : 'paid'
                              )}
                            >
                              {order.status === 'paid' ? t('status.paid') : t('status.unpaid')}
                            </Badge>
                            <Badge 
                              variant={getCookStatusVariant(order.cookStatus || 'pending')}
                              className={`cursor-pointer text-xs ${getCookStatusColor(order.cookStatus || 'pending')}`}
                            >
                              {t(`status.${order.cookStatus || 'pending'}`)}
                            </Badge>
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <div className='flex-shrink-0 ml-2'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <IconDotsVertical className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>{t('table.actions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            {/* View Details */}
                            <DropdownMenuItem onClick={() => viewOrderDetails(order)}>
                              <IconEye className='mr-2 h-4 w-4' />
                              {t('action.viewDetails')}
                            </DropdownMenuItem>
                            
                            {/* Edit Order */}
                            <DropdownMenuItem onClick={() => editOrder(order)}>
                              <IconEdit className='mr-2 h-4 w-4' />
                              {t('action.editOrder')}
                            </DropdownMenuItem>
                            
                            {/* Update Status */}
                            <DropdownMenuItem 
                              onClick={() => updateOrderStatus(
                                order.orderId!, 
                                order.status === 'paid' ? 'unpaid' : 'paid'
                              )}
                            >
                              <IconEdit className='mr-2 h-4 w-4' />
                              {order.status === 'paid' ? t('action.markAsUnpaid') : t('action.markAsPaid')}
                            </DropdownMenuItem>
                            
                            {/* Share to Cook */}
                            <DropdownMenuItem 
                              onClick={() => shareOrderToCook(order.orderId!)}
                              disabled={order.sharedToCook}
                            >
                              <IconChefHat className='mr-2 h-4 w-4' />
                              {order.sharedToCook ? t('action.sharedToCook') : t('action.shareToCook')}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            {/* Delete Order */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className='text-red-600'
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <IconTrash className='mr-2 h-4 w-4' />
                                  {t('action.deleteOrder')}
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('dialog.deleteConfirm')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the order
                                    for {order.name}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('delete.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => deleteOrder(order.orderId!)}
                                    className='bg-red-600 hover:bg-red-700'
                                  >
                                    {t('delete.confirm')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Dialog */}
        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Orders Report</DialogTitle>
              <DialogDescription>
                Select date range to generate PDF report. Current filters will be applied.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...exportForm}>
              <form onSubmit={exportForm.handleSubmit(onExportSubmit)} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={exportForm.control}
                    name='startDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('export.startDate')}</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={exportForm.control}
                    name='endDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('export.endDate')}</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className='text-sm text-muted-foreground'>
                  <p>The PDF report will include:</p>
                  <ul className='list-disc list-inside mt-1'>
                    <li>All order details and customer information</li>
                    <li>Payment information with calculations in OMR</li>
                    <li>Order status and cook status</li>
                    <li>Summary statistics and totals</li>
                    <li>Current filter settings will be applied</li>
                  </ul>
                </div>
                
                <div className='flex justify-end space-x-2'>
                  <Button type='button' variant='outline' onClick={() => setIsExportDialogOpen(false)}>
                    {t('action.cancel')}
                  </Button>
                  <Button type='submit'>
                    <IconDownload className='h-4 w-4 mr-2' />
                    Generate PDF Report
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Order Details Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>{t('dialog.orderDetails')}</DialogTitle>
              <DialogDescription>
                Complete information for order #{selectedOrder?.orderId}
              </DialogDescription>
            </DialogHeader>
            
            {selectedOrder && (
              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <h4 className='font-semibold mb-2'>{t('info.customerInformation')}</h4>
                    <div className='space-y-2 text-sm'>
                      <p><strong>{t('info.name')}:</strong> {selectedOrder.name}</p>
                      <p><strong>{t('info.phone')}:</strong> {selectedOrder.phoneNumber}</p>
                      <p><strong>{t('info.location')}:</strong> {selectedOrder.location}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className='font-semibold mb-2'>{t('info.orderInformation')}</h4>
                    <div className='space-y-2 text-sm'>
                      <p><strong>{t('info.receiptNo')}:</strong> {selectedOrder.receiptNo}</p>
                      <p><strong>{t('info.date')}:</strong> {selectedOrder.date}</p>
                      <p><strong>{t('info.time')}:</strong> {selectedOrder.time}</p>
                      <p><strong>{t('info.deliveryType')}:</strong> {selectedOrder.deliveryType}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className='font-semibold mb-2'>{t('cook.orderDetails')}</h4>
                  <p className='text-sm bg-muted p-3 rounded border'>
                    {selectedOrder.orderDetails}
                  </p>
                </div>
                
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <h4 className='font-semibold mb-2'>{t('info.paymentInformation')}</h4>
                    <div className='space-y-2 text-sm'>
                      <p><strong>{t('info.totalPayment')}:</strong> {formatCurrency(selectedOrder.totalPayment)}</p>
                      <p><strong>{t('info.discount')}:</strong> {formatCurrency(selectedOrder.discount || '0')}</p>
                      <p><strong>{t('info.finalTotal')}:</strong> {formatCurrency(calculateFinalTotal(selectedOrder.totalPayment, selectedOrder.discount || '0'))}</p>
                      <p><strong>{t('info.advancePayment')}:</strong> {formatCurrency(selectedOrder.advancePayment)}</p>
                      <p><strong>{t('info.balancePayment')}:</strong> {formatCurrency(calculateBalance(selectedOrder.totalPayment, selectedOrder.advancePayment, selectedOrder.discount || '0'))}</p>
                      <p><strong>{t('info.paymentType')}:</strong> {t(`payment.${selectedOrder.paymentType}`)}</p>
                      <p><strong>{t('info.paymentStatus')}:</strong> 
                        <Badge 
                          variant={selectedOrder.status === 'paid' ? 'default' : 'destructive'}
                          className='ml-2'
                        >
                          {selectedOrder.status === 'paid' ? t('status.paid') : t('status.unpaid')}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className='font-semibold mb-2'>{t('info.orderStatus')}</h4>
                    <div className='space-y-2 text-sm'>
                      <p><strong>{t('info.created')}:</strong> {new Date(selectedOrder.createdAt!).toLocaleString()}</p>
                      <p><strong>{t('info.cookStatus')}:</strong> 
                        <Badge 
                          variant={getCookStatusVariant(selectedOrder.cookStatus || 'pending')}
                          className='ml-2'
                        >
                          {t(`status.${selectedOrder.cookStatus || 'pending'}`)}
                        </Badge>
                      </p>
                      <p><strong>{t('info.sharedToCook')}:</strong> 
                        <Badge 
                          variant={selectedOrder.sharedToCook ? 'default' : 'secondary'}
                          className='ml-2'
                        >
                          {selectedOrder.sharedToCook ? t('info.yes') : t('info.no')}
                        </Badge>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle>{t('dialog.editOrder')}</DialogTitle>
              <DialogDescription>
                Update order information for #{editingOrder?.orderId}
              </DialogDescription>
            </DialogHeader>
            
            {editingOrder && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className='space-y-6'>
                  {/* Customer Information */}
                  <div className='space-y-4'>
                    <h4 className='font-semibold text-lg border-b pb-2'>{t('info.customerInformation')}</h4>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={editForm.control}
                        name='name'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.customerName')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='phoneNumber'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.phoneNumber')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='location'
                        render={({ field }) => (
                          <FormItem className='md:col-span-2'>
                            <FormLabel>{t('field.location')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Order Information */}
                  <div className='space-y-4'>
                    <h4 className='font-semibold text-lg border-b pb-2'>{t('info.orderInformation')}</h4>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={editForm.control}
                        name='receiptNo'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.receiptNumber')}</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='date'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.date')}</FormLabel>
                            <FormControl>
                              <Input type='date' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='time'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.time')}</FormLabel>
                            <FormControl>
                              <Input type='time' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='deliveryType'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.deliveryType')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('field.deliveryType.placeholder')} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='pickup'>{t('delivery.pickup')}</SelectItem>
                                <SelectItem value='home-delivery'>{t('delivery.homeDelivery')}</SelectItem>
                                <SelectItem value='express-delivery'>{t('delivery.expressDelivery')}</SelectItem>
                                <SelectItem value='standard-delivery'>{t('delivery.standardDelivery')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={editForm.control}
                      name='orderDetails'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('field.orderDetails')}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className='min-h-[100px]' />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Payment Information */}
                  <div className='space-y-4'>
                    <h4 className='font-semibold text-lg border-b pb-2'>{t('info.paymentInformation')}</h4>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={editForm.control}
                        name='totalPayment'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.totalPayment')} (OMR)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.001' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='discount'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.discount')} (OMR)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.001' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='advancePayment'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.advancePayment')} (OMR)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.001' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='balancePayment'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('field.balancePayment')} (OMR)</FormLabel>
                            <FormControl>
                              <Input type='number' step='0.001' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Calculated Total Display */}
                    <div className='p-4 bg-muted rounded-lg'>
                      <p className='text-lg font-semibold'>
                        {t('calc.finalTotal')}: {formatCurrency(calculateFinalTotal(watchedValues[0] || '0', watchedValues[2] || '0'))}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {t('calc.totalMinusDiscount')}
                      </p>
                    </div>
                    
                    <FormField
                      control={editForm.control}
                      name='paymentType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('field.paymentType')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className='flex flex-row space-x-8'
                            >
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='cash' id='cash' />
                                <Label htmlFor='cash'>{t('payment.cash')}</Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='atm' id='atm' />
                                <Label htmlFor='atm'>{t('payment.atm')}</Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <RadioGroupItem value='transfer' id='transfer' />
                                <Label htmlFor='transfer'>{t('payment.transfer')}</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Status Information */}
                  <div className='space-y-4'>
                    <h4 className='font-semibold text-lg border-b pb-2'>{t('info.orderStatus')}</h4>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                      <FormField
                        control={editForm.control}
                        name='status'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('info.paymentStatus')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='paid'>{t('status.paid')}</SelectItem>
                                <SelectItem value='unpaid'>{t('status.unpaid')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name='cookStatus'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('info.cookStatus')}</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value='pending'>{t('status.pending')}</SelectItem>
                                <SelectItem value='preparing'>{t('status.preparing')}</SelectItem>
                                <SelectItem value='ready'>{t('status.ready')}</SelectItem>
                                <SelectItem value='delivered'>{t('status.delivered')}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex justify-end space-x-4 pt-6 border-t'>
                    <Button 
                      type='button' 
                      variant='outline' 
                      onClick={() => setIsEditDialogOpen(false)}
                    >
                      {t('action.cancel')}
                    </Button>
                    <Button type='submit' disabled={isSubmitting}>
                      {isSubmitting ? t('button.updating') : t('button.updateOrder')}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}