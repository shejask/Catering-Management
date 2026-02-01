'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  IconDeviceFloppy, 
  IconUser, 
  IconPhone, 
  IconCalendar, 
  IconClock, 
  IconClipboardList, 
  IconMapPin, 
  IconTruck, 
  IconCurrencyDollar, 
  IconCreditCard,
  IconCalculator,
  IconEdit
} from '@tabler/icons-react';
import { orderService, OrderData } from '@/services/orderService';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/language-context';

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    receiptNo: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    orderDetails: '',
    totalPayment: '',
    advancePayment: '',
    location: '',
    paymentType: 'cash' as 'cash' | 'atm' | 'transfer',
    deliveryType: 'pickup'
  });

  // Check if we're editing an existing order
  useEffect(() => {
    const editParam = searchParams.get('edit');
    if (editParam) {
      try {
        const orderData = JSON.parse(decodeURIComponent(editParam));
        setIsEditing(true);
        setEditingOrderId(orderData.orderId);
        
        // Pre-fill the form with existing order data
        setFormData({
          name: orderData.name || '',
          phoneNumber: orderData.phoneNumber || '',
          receiptNo: orderData.receiptNo || '',
          date: orderData.date || new Date().toISOString().split('T')[0],
          time: orderData.time || '',
          orderDetails: orderData.orderDetails || '',
          totalPayment: orderData.totalPayment || '',
          advancePayment: orderData.advancePayment || '',
          location: orderData.location || '',
          paymentType: orderData.paymentType || 'cash',
          deliveryType: orderData.deliveryType || 'pickup'
        });
      } catch (error) {
        console.error('Error parsing edit parameter:', error);
        // If there's an error parsing, treat as new order
        setIsEditing(false);
        setEditingOrderId(null);
      }
    }
  }, [searchParams]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBalance = () => {
    const total = parseFloat(formData.totalPayment) || 0;
    const advance = parseFloat(formData.advancePayment) || 0;
    return Math.max(0, total - advance);
  };

  const formatCurrency = (amount: number) => {
    if (language === 'en') {
      return `OMR ${amount.toFixed(3)}`;
    } else {
      return new Intl.NumberFormat('ar-OM', {
        style: 'currency',
        currency: 'OMR',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      }).format(amount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phoneNumber || !formData.receiptNo || !formData.orderDetails || !formData.totalPayment) {
      toast.error(t('message.fillRequiredFields'));
      return;
    }

    try {
      setLoading(true);
      
      const orderData: OrderData = {
        name: formData.name,
        receiptNo: formData.receiptNo,
        date: formData.date,
        time: formData.time,
        phoneNumber: formData.phoneNumber,
        orderDetails: formData.orderDetails,
        totalPayment: formData.totalPayment,
        advancePayment: formData.advancePayment,
        balancePayment: calculateBalance().toString(),
        location: formData.location,
        paymentType: formData.paymentType,
        deliveryType: formData.deliveryType,
        status: 'unpaid',
        cookStatus: 'pending'
      };

      if (isEditing && editingOrderId) {
        // Update existing order
        await orderService.updateOrder(editingOrderId, orderData);
        toast.success(t('message.orderUpdated') || 'Order updated successfully');
      } else {
        // Create new order
        await orderService.createOrder(orderData);
        toast.success(t('message.orderCreated'));
      }
      
      router.push('/dashboard/receptionist/overview');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving order:', error);
      toast.error(t('message.orderError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <IconClipboardList className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold tracking-tight">
            {isEditing ? t('page.editOrder') || 'Edit Order' : t('page.createOrder')}
          </h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
           
            <CardTitle>{t('section.orderInformation')}</CardTitle>
          </div>
          <CardDescription>
            {isEditing 
              ? t('page.editOrderDescription') || 'Edit the order details below'
              : t('page.createOrderDescription')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
                         {/* Customer Information */}
             <div className="space-y-4">
               <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center space-x-2">
                    <IconUser className="h-4 w-4" />
                    <span>{t('field.customerName')} *</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t('field.customerName.placeholder')}
                    required
                    className="pl-10"
                  />
                </div>
                
                                 <div className="space-y-2">
                   <Label htmlFor="phoneNumber" className="flex items-center space-x-2">
                     <IconPhone className="h-4 w-4" />
                     <span>{t('field.phoneNumber')} *</span>
                   </Label>
                   <Input
                     id="phoneNumber"
                     value={formData.phoneNumber}
                     onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                     placeholder={t('field.phoneNumber.placeholder')}
                     required
                     className="pl-10"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="receiptNo" className="flex items-center space-x-2">
                     <IconClipboardList className="h-4 w-4" />
                     <span>{t('field.receiptNumber')} *</span>
                   </Label>
                   <Input
                     id="receiptNo"
                     value={formData.receiptNo}
                     onChange={(e) => handleInputChange('receiptNo', e.target.value)}
                     placeholder={t('field.receiptNumber.placeholder')}
                     required
                     className="pl-10"
                   />
                 </div>
               </div>
             </div>

            {/* Date and Time */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center space-x-2">
                    <IconCalendar className="h-4 w-4" />
                    <span>{t('field.date')} *</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center space-x-2">
                    <IconClock className="h-4 w-4" />
                    <span>{t('field.time')}</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderDetails" className="flex items-center space-x-2">
                  <IconClipboardList className="h-4 w-4" />
                  <span>{t('field.orderDetails')} *</span>
                </Label>
                <Textarea
                  id="orderDetails"
                  value={formData.orderDetails}
                  onChange={(e) => handleInputChange('orderDetails', e.target.value)}
                  placeholder={t('field.orderDetails.placeholder')}
                  rows={4}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            {/* Location and Delivery */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center space-x-2">
                    <IconMapPin className="h-4 w-4" />
                    <span>{t('field.location')}</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder={t('field.deliveryLocation.placeholder')}
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryType" className="flex items-center space-x-2">
                    <IconTruck className="h-4 w-4" />
                    <span>{t('field.deliveryType')}</span>
                  </Label>
                  <Select value={formData.deliveryType} onValueChange={(value) => handleInputChange('deliveryType', value)}>
                    <SelectTrigger className="pl-10">
                      <SelectValue placeholder={t('field.deliveryType.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">{t('delivery.pickup')}</SelectItem>
                      <SelectItem value="home-delivery">{t('delivery.homeDelivery')}</SelectItem>
                      <SelectItem value="express-delivery">{t('delivery.expressDelivery')}</SelectItem>
                      <SelectItem value="standard-delivery">{t('delivery.standardDelivery')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="totalPayment" className="flex items-center space-x-2">
                    <IconCurrencyDollar className="h-4 w-4" />
                    <span>{t('field.totalPayment')} *</span>
                  </Label>
                  <Input
                    id="totalPayment"
                    type="number"
                    value={formData.totalPayment}
                    onChange={(e) => handleInputChange('totalPayment', e.target.value)}
                    placeholder={t('field.totalPayment.placeholder')}
                    step="0.001"
                    required
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="advancePayment" className="flex items-center space-x-2">
                    <IconCreditCard className="h-4 w-4" />
                    <span>{t('field.advancePayment')}</span>
                  </Label>
                  <Input
                    id="advancePayment"
                    type="number"
                    value={formData.advancePayment}
                    onChange={(e) => handleInputChange('advancePayment', e.target.value)}
                    placeholder={t('field.advancePayment.placeholder')}
                    step="0.001"
                    className="pl-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <IconCalculator className="h-4 w-4" />
                    <span>{t('field.balancePayment')}</span>
                  </Label>
                  <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                    <IconCurrencyDollar className="h-4 w-4 mr-2 text-gray-600" />
                    <span className="text-sm font-medium">{formatCurrency(calculateBalance())}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label htmlFor="paymentType" className="flex items-center space-x-2">
                <IconCreditCard className="h-4 w-4" />
                <span>{t('field.paymentType')}</span>
              </Label>
              <Select value={formData.paymentType} onValueChange={(value) => handleInputChange('paymentType', value)}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder={t('field.paymentType.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t('payment.cash')}</SelectItem>
                  <SelectItem value="atm">{t('payment.atm')}</SelectItem>
                  <SelectItem value="transfer">{t('payment.transfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/receptionist/overview')}
              >
                {t('action.cancel')}
              </Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing 
                      ? (t('button.updating') || 'Updating...')
                      : (t('button.creating') || 'Creating...')
                    }
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <IconEdit className="mr-2 h-4 w-4" />
                    ) : (
                      <IconDeviceFloppy className="mr-2 h-4 w-4" />
                    )}
                    {isEditing 
                      ? (t('button.updateOrder') || 'Update Order')
                      : t('button.createOrder')
                    }
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 