'use client';
import axios from 'axios';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  IconClipboardList,
  IconClock,
  IconCircleCheck,
  IconCalendar,
  IconPlus,
  IconDownload,
  IconLoader2,
  IconEdit,
  IconTrash
} from '@tabler/icons-react';
import {
  dashboardService,
  DashboardKPIs,
  OrderWithStatus
} from '@/services/dashboardService';
// Import the fixed PDF utility
import {
  downloadOrdersPDF,
  downloadOrderReceipt,
  testArabicPDF
} from '@/lib/pdf-utils';
import { useLanguage } from '@/contexts/language-context';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { AlertModal } from '@/components/modal/alert-modal';
import { useRouter } from 'next/navigation';

export default function ReceptionistOverviewPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<DashboardKPIs>({
    todayOrders: 0,
    cookedOrders: 0,
    completedOrders: 0,
    upcomingOrders: 0
  });
  const [todayOrders, setTodayOrders] = useState<OrderWithStatus[]>([]);
  const [upcomingOrders, setUpcomingOrders] = useState<OrderWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [testLoading, setTestLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderWithStatus | null>(null);

  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [kpisData, todayData, upcomingData] = await Promise.all([
          dashboardService.getDashboardKPIs(),
          dashboardService.getTodayOrders(),
          dashboardService.getUpcomingOrders()
        ]);

        setKpis(kpisData);
        setTodayOrders(todayData);
        setUpcomingOrders(upcomingData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      title: t('dashboard.todayOrders'),
      value: kpis.todayOrders.toString(),
      description: t('dashboard.ordersForToday'),
      icon: IconClipboardList,
      color: 'text-blue-600'
    },
    {
      title: t('dashboard.cookedOrders'),
      value: kpis.cookedOrders.toString(),
      description: t('dashboard.currentlyCooking'),
      icon: IconClock,
      color: 'text-orange-600'
    },
    {
      title: t('dashboard.completedOrders'),
      value: kpis.completedOrders.toString(),
      description: t('dashboard.deliveredToday'),
      icon: IconCircleCheck,
      color: 'text-green-600'
    },
    {
      title: t('dashboard.upcomingOrders'),
      value: kpis.upcomingOrders.toString(),
      description: t('dashboard.ordersForUpcoming'),
      icon: IconCalendar,
      color: 'text-purple-600'
    }
  ];

  const getStatusBadge = (cookStatus: string) => {
    const variant = dashboardService.getStatusBadgeVariant(cookStatus);
    const status = dashboardService.getDisplayStatus(cookStatus);

    return (
      <Badge variant={variant}>{t(`status.${status.toLowerCase()}`)}</Badge>
    );
  };

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);

    if (language === 'en') {
      return `OMR ${num.toFixed(3)}`;
    } else {
      // Arabic format
      return new Intl.NumberFormat('ar-OM', {
        style: 'currency',
        currency: 'OMR',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(num);
    }
  };

  const handleDownloadTodayOrders = async () => {
    if (todayOrders.length === 0) return;

    console.log(todayOrders);

    try {
      setPdfLoading(true);

      const response = await axios.post(
        '/api/generate-pdf',
        {
          orders: todayOrders,
          language: 'ar',
          showSummary: true,
          autoPrint: true
        },
        {
          responseType: 'blob' // Important: Set response type to blob
        }
      );

      // Check if response is PDF or HTML
      const contentType = response.headers['content-type'];

      if (contentType && contentType.includes('application/pdf')) {
        // PDF response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `طلبات-اليوم-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        // Show success message
        if (language === 'ar') {
          alert('تم إنشاء ملف PDF بنجاح!');
        } else {
          alert('Arabic PDF generated successfully!');
        }
      } else if (contentType && contentType.includes('text/html')) {
        // HTML fallback response
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Show info message
        // if (language === 'ar') {
        //   alert('تم إنشاء ملف HTML كبديل. يرجى طباعته كـ PDF.');
        // } else {
        //   alert('HTML file generated as fallback. Please print it as PDF.');
        // }
      } else {
        throw new Error('Unexpected response type');
      }
    } catch (error) {
      console.error('Error downloading today orders PDF:', error);
      const errorMessage =
        language === 'ar'
          ? 'فشل في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.'
          : 'Failed to generate PDF. Please try again later.';
      alert(errorMessage);
    } finally {
      setPdfLoading(false);
    }

    // try {
    //   setPdfLoading(true);

    //   // Always generate Arabic PDF
    //   const arabicTitle = 'طلبات اليوم';

    //   await downloadOrdersPDF({
    //     title: arabicTitle,
    //     orders: todayOrders,
    //     language: 'ar', // Force Arabic
    //     showSummary: true // Show summary for better report
    //   });

    //   // Show success message
    //   if (language === 'ar') {
    //     alert('تم إنشاء ملف PDF بنجاح!');
    //   } else {
    //     alert('Arabic PDF generated successfully!');
    //   }
    // } catch (error) {
    //   console.error('Error downloading today orders PDF:', error);
    //   const errorMessage =
    //     language === 'ar'
    //       ? 'فشل في إنشاء ملف PDF. يرجى المحاولة مرة أخرى.'
    //       : 'Failed to generate PDF. Please try again later.';
    //   alert(errorMessage);
    // } finally {
    //   setPdfLoading(false);
    // }
  };

  const handleDownloadReceipt = async (order: OrderWithStatus) => {
    const orderId = order.orderId || order.receiptNo || 'unknown';

    try {
      setReceiptLoading((prev) => ({ ...prev, [orderId]: true }));

      // Use the new Puppeteer receipt API
      const response = await axios.post(
        '/api/generate-receipt',
        {
          order: order,
          language: 'ar', // Always use Arabic for receipts
          useDefaultLogo: true, // Use the default logo from public/assets/images/invoice-header.png
          logoUrl: undefined, // You can override with a custom logo URL here
          autoPrint: true
        },
        {
          responseType: 'blob'
        }
      );

      // Check if response is PDF or HTML
      const contentType = response.headers['content-type'];

      if (contentType && contentType.includes('application/pdf')) {
        // PDF response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = `إيصال-${order.receiptNo || order.orderId || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        // Show success message
        const successMessage =
          language === 'ar'
            ? 'تم إنشاء الإيصال بنجاح!'
            : 'Receipt generated successfully!';
        alert(successMessage);
      } else if (contentType && contentType.includes('text/html')) {
        // HTML fallback response
        const blob = new Blob([response.data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');

        // Show info message
        const infoMessage =
          language === 'ar'
            ? 'تم إنشاء ملف HTML كبديل. يرجى طباعته كـ PDF.'
            : 'HTML file generated as fallback. Please print it as PDF.';
        // alert(infoMessage);
      } else {
        throw new Error('Unexpected response type');
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
      const errorMessage =
        language === 'ar'
          ? 'فشل في إنشاء الإيصال. يرجى المحاولة مرة أخرى.'
          : 'Failed to generate receipt. Please try again later.';
      alert(errorMessage);
    } finally {
      setReceiptLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleTestArabicPDF = async () => {
    try {
      setTestLoading(true);
      console.log('Testing Arabic PDF generation with Puppeteer...');

      await testArabicPDF();

      console.log('Arabic PDF test completed successfully');
      alert('Arabic PDF test completed! Check the generated file.');
    } catch (error) {
      console.error('Arabic PDF test failed:', error);
      alert('Arabic PDF test failed. Check console for details.');
    } finally {
      setTestLoading(false);
    }
  };

  const handleEditOrder = (order: OrderWithStatus) => {
    // Navigate to create order page with order data for editing
    const orderData = encodeURIComponent(JSON.stringify(order));
    router.push(`/dashboard/receptionist/create-order?edit=${orderData}`);
  };

  const handleDeleteOrder = (order: OrderWithStatus) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;

    const orderId = orderToDelete.orderId || orderToDelete.receiptNo || 'unknown';
    
    try {
      setDeleteLoading(prev => ({ ...prev, [orderId]: true }));
      
      await orderService.deleteOrder(orderId);
      
      // Remove the order from the local state
      setTodayOrders(prev => prev.filter(order => 
        (order.orderId || order.receiptNo) !== (orderToDelete.orderId || orderToDelete.receiptNo)
      ));
      
      // Update KPIs
      setKpis(prev => ({
        ...prev,
        todayOrders: Math.max(0, prev.todayOrders - 1)
      }));

      // Removed the success alert message
      
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = language === 'ar'
        ? 'فشل في حذف الطلب. يرجى المحاولة مرة أخرى.'
        : 'Failed to delete order. Please try again.';
      alert(errorMessage);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [orderId]: false }));
      setShowDeleteModal(false);
      setOrderToDelete(null);
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  if (loading) {
    return (
      <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
        <div className='flex h-64 items-center justify-center'>
          <div className='text-center'>
            <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
            <p className='text-muted-foreground'>{t('message.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4 p-4 pt-6 md:p-8'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>
          {t('page.receptionistDashboard')}
        </h2>
        <div className='flex items-center space-x-2'>
          <Button asChild>
            <Link href='/dashboard/receptionist/create-order'>
              <IconPlus className='mr-2 h-4 w-4' />
              {t('button.createOrder')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <p className='text-muted-foreground text-xs'>
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today and Upcoming Orders */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Today Orders */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>{t('dashboard.todayOrders')}</CardTitle>
                <CardDescription>
                  {t('dashboard.ordersScheduledForToday')}
                </CardDescription>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleDownloadTodayOrders}
                disabled={todayOrders.length === 0 || pdfLoading}
                className='border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50'
                title={
                  language === 'ar'
                    ? 'تحميل PDF بالعربية'
                    : 'Download Arabic PDF'
                }
              >
                {pdfLoading ? (
                  <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <IconDownload className='mr-2 h-4 w-4' />
                )}
                {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {todayOrders.length === 0 ? (
              <div className='py-8 text-center'>
                <IconCalendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>
                  {t('message.noOrdersForToday')}
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {todayOrders.map((order) => {
                  const orderId = order.orderId || order.receiptNo || 'unknown';
                  const isReceiptLoading = receiptLoading[orderId];

                  return (
                    <div
                      key={order.orderId}
                      className='rounded-lg border p-4 space-y-3'
                    >
                      {/* Order Information */}
                      <div className='space-y-2'>
                        <p className='text-sm leading-none font-medium'>
                          {order.name}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          {order.orderDetails}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {order.receiptNo} • {order.timeAgo}
                        </p>
                      </div>

                      {/* Order Status and Actions Row */}
                      <div className='flex items-center justify-between pt-2 border-t'>
                        <div className='flex items-center space-x-3'>
                          <span className='text-sm font-medium'>
                            {formatCurrency(order.totalPayment)}
                          </span>
                          {getStatusBadge(order.cookStatus || 'pending')}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className='flex items-center space-x-2'>
                          {/* Edit Order Button */}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditOrder(order)}
                            className='border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                            title={
                              language === 'ar'
                                ? 'تعديل الطلب'
                                : 'Edit Order'
                            }
                          >
                            <IconEdit className='mr-2 h-4 w-4' />
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                          </Button>

                          {/* Delete Order Button */}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDeleteOrder(order)}
                            disabled={deleteLoading[orderId]}
                            className='border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50'
                            title={
                              language === 'ar'
                                ? 'حذف الطلب'
                                : 'Delete Order'
                            }
                          >
                            {deleteLoading[orderId] ? (
                              <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <IconTrash className='mr-2 h-4 w-4' />
                            )}
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </Button>

                          {/* Download Receipt Button */}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDownloadReceipt(order)}
                            disabled={isReceiptLoading}
                            className='border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50'
                            title={
                              language === 'ar'
                                ? 'تحميل الإيصال بالعربية'
                                : 'Download Arabic Receipt'
                            }
                          >
                            {isReceiptLoading ? (
                              <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <IconDownload className='mr-2 h-4 w-4' />
                            )}
                            {language === 'ar'
                              ? 'تحميل الإيصال'
                              : 'Download Receipt'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Orders */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('dashboard.upcomingOrders')}</CardTitle>
              <CardDescription>
                {t('dashboard.ordersScheduledForUpcoming')}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingOrders.length === 0 ? (
              <div className='py-8 text-center'>
                <IconCalendar className='text-muted-foreground mx-auto mb-4 h-12 w-12' />
                <p className='text-muted-foreground'>
                  {t('message.noOrdersForUpcoming')}
                </p>
              </div>
            ) : (
              <div className='space-y-4'>
                {upcomingOrders.map((order) => {
                  const orderId = order.orderId || order.receiptNo || 'unknown';
                  const isReceiptLoading = receiptLoading[orderId];

                  return (
                    <div
                      key={order.orderId}
                      className='rounded-lg border p-4 space-y-3'
                    >
                      {/* Order Information */}
                      <div className='space-y-2'>
                        <p className='text-sm leading-none font-medium'>
                          {order.name}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          {order.orderDetails}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {order.receiptNo} • {order.timeAgo}
                        </p>
                      </div>

                      {/* Order Status and Actions Row */}
                      <div className='flex items-center justify-between pt-2 border-t'>
                        <div className='flex items-center space-x-3'>
                          <span className='text-sm font-medium'>
                            {formatCurrency(order.totalPayment)}
                          </span>
                          {getStatusBadge(order.cookStatus || 'pending')}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className='flex items-center space-x-2'>
                          {/* Edit Order Button */}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditOrder(order)}
                            className='border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                            title={
                              language === 'ar'
                                ? 'تعديل الطلب'
                                : 'Edit Order'
                            }
                          >
                            <IconEdit className='mr-2 h-4 w-4' />
                            {language === 'ar' ? 'تعديل' : 'Edit'}
                          </Button>

                          {/* Delete Order Button */}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDeleteOrder(order)}
                            disabled={deleteLoading[orderId]}
                            className='border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50'
                            title={
                              language === 'ar'
                                ? 'حذف الطلب'
                                : 'Delete Order'
                            }
                          >
                            {deleteLoading[orderId] ? (
                              <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <IconTrash className='mr-2 h-4 w-4' />
                            )}
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </Button>

                          {/* Download Receipt Button */}
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleDownloadReceipt(order)}
                            disabled={isReceiptLoading}
                            className='border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50'
                            title={
                              language === 'ar'
                                ? 'تحميل الإيصال بالعربية'
                                : 'Download Arabic Receipt'
                            }
                          >
                            {isReceiptLoading ? (
                              <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
                            ) : (
                              <IconDownload className='mr-2 h-4 w-4' />
                            )}
                            {language === 'ar'
                              ? 'تحميل الإيصال'
                              : 'Download Receipt'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteOrder}
        onConfirm={confirmDeleteOrder}
        loading={orderToDelete ? deleteLoading[orderToDelete.orderId || orderToDelete.receiptNo || 'unknown'] : false}
      />
    </div>
  );
}
