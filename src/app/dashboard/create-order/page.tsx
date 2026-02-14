'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/language-context';
import { orderService, type OrderData } from '@/services/orderService';
import { toast } from 'sonner';

export default function CreateOrderPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useLanguage();

  // Create form schema with translated validation messages
  const formSchema = z.object({
    name: z.string().min(1, t('validation.nameRequired')),
    receiptNo: z.string().min(1, t('validation.receiptRequired')),
    date: z.string().min(1, t('validation.dateRequired')),
    time: z.string().min(1, t('validation.timeRequired')),
    phoneNumber: z.string().min(1, t('validation.phoneRequired')),
    orderDetails: z.string().min(1, t('validation.orderDetailsRequired')),
    totalPayment: z.string().min(1, t('validation.totalPaymentRequired')).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: t('validation.totalPaymentInvalid') || 'Total payment must be a valid positive number'
    }),
    advancePayment: z.string().min(1, t('validation.advancePaymentRequired')).refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: t('validation.advancePaymentInvalid') || 'Advance payment must be a valid number'
    }),
    location: z.string().min(1, t('validation.locationRequired')),
    paymentType: z.enum(['cash', 'atm', 'transfer'], {
      required_error: t('validation.paymentTypeRequired')
    }),
    deliveryType: z.string().min(1, t('validation.deliveryTypeRequired'))
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      receiptNo: '',
      date: new Date().toISOString().split('T')[0], // Auto-fill current date
      time: '',
      phoneNumber: '',
      orderDetails: '',
      totalPayment: '',
      advancePayment: '',
      location: '',
      paymentType: undefined,
      deliveryType: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Validate payment amounts
      const totalPayment = Number(data.totalPayment);
      const advancePayment = Number(data.advancePayment);
      
      if (advancePayment > totalPayment) {
        toast.error(t('message.advanceExceedsTotal') || 'Advance payment cannot exceed total payment');
        return;
      }

      // Prepare order data with automatic cook sharing
      const orderData: OrderData = {
        ...data,
        totalPayment: totalPayment.toString(),
        advancePayment: advancePayment.toString(),
        sharedToCook: true, // Automatically share with cook
        cookStatus: 'pending' as const,
        status: 'unpaid' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save order to Firebase Realtime Database
      const orderId = await orderService.createOrder(orderData);
      
      console.log('Order created with ID:', orderId);
      
      // Show success message
      toast.success(t('message.orderCreated') || 'Order created successfully!', {
        description: `Order ID: ${orderId} - Shared with kitchen`,
        duration: 5000,
      });
      
      // Reset form after successful submission
      form.reset({
        name: '',
        receiptNo: '',
        date: new Date().toISOString().split('T')[0], // Keep current date
        time: '',
        phoneNumber: '',
        orderDetails: '',
        totalPayment: '',
        advancePayment: '',
        location: '',
        paymentType: undefined,
        deliveryType: ''
      });
      
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Show error message
      toast.error(t('message.orderError') || 'Error creating order', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        {/* Page Header */}
        <div className='flex items-center justify-start'>
          <h1 className='text-2xl sm:text-3xl font-bold tracking-tight'>
            {t('page.createOrder') || 'Create Order'}
          </h1>
        </div>

        {/* Main Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t('section.orderInformation') || 'Order Information'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-8'
              >
                {/* Customer Information Section */}
                <div className='space-y-6'>
                  <h3 className='text-lg font-medium border-b pb-2'>
                    {t('section.customerInformation') || 'Customer Information'}
                  </h3>
                  <div className='grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2'>
                    {/* Name */}
                    <FormField
                      control={form.control}
                      name='name'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.customerName') || 'Customer Name'}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('field.customerName.placeholder') || 'Enter customer name'}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone Number */}
                    <FormField
                      control={form.control}
                      name='phoneNumber'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.phoneNumber') || 'Phone Number'}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('field.phoneNumber.placeholder') || 'Enter phone number'}
                              type='tel'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Location */}
                    <FormField
                      control={form.control}
                      name='location'
                      render={({ field }) => (
                        <FormItem className='sm:col-span-2'>
                          <FormLabel>
                            {t('field.deliveryLocation') || 'Delivery Location'}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('field.deliveryLocation.placeholder') || 'Enter delivery address'}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Order Details Section */}
                <div className='space-y-6'>
                  <h3 className='text-lg font-medium border-b pb-2'>
                    {t('section.orderDetails') || 'Order Details'}
                  </h3>
                  <div className='grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2'>
                    {/* Receipt No */}
                    <FormField
                      control={form.control}
                      name='receiptNo'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.receiptNumber') || 'Receipt Number'}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('field.receiptNumber.placeholder') || 'Enter receipt number'}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date */}
                    <FormField
                      control={form.control}
                      name='date'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.date') || 'Date'}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type='date' 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Time */}
                    <FormField
                      control={form.control}
                      name='time'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.time') || 'Time'}
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type='time' 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Type of Delivery */}
                    <FormField
                      control={form.control}
                      name='deliveryType'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.deliveryType') || 'Delivery Type'}
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('field.deliveryType.placeholder') || 'Select delivery type'} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='pickup'>{t('delivery.pickup') || 'Pickup'}</SelectItem>
                              <SelectItem value='home-delivery'>{t('delivery.homeDelivery') || 'Home Delivery'}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Order Details Textarea */}
                  <FormField
                    control={form.control}
                    name='orderDetails'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('field.orderDetails') || 'Order Details'}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('field.orderDetails.placeholder') || 'Enter order details...'}
                            className='min-h-[120px] resize-none'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Payment Information Section */}
                <div className='space-y-6'>
                  <h3 className='text-lg font-medium border-b pb-2'>
                    {t('section.paymentInformation') || 'Payment Information'}
                  </h3>
                  <div className='grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2'>
                    {/* Total Payment */}
                    <FormField
                      control={form.control}
                      name='totalPayment'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.totalPayment') || 'Total Payment'} (OMR)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('field.totalPayment.placeholder') || '0.000'}
                              type='number'
                              step='0.001'
                              min='0'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Advance Payment */}
                    <FormField
                      control={form.control}
                      name='advancePayment'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('field.advancePayment') || 'Advance Payment'} (OMR)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('field.advancePayment.placeholder') || '0.000'}
                              type='number'
                              step='0.001'
                              min='0'
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Type of Payment */}
                  <FormField
                    control={form.control}
                    name='paymentType'
                    render={({ field }) => (
                      <FormItem className='space-y-3'>
                        <FormLabel>
                          {t('field.paymentType') || 'Payment Type'}
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className='flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-8'
                          >
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='cash' id='cash' />
                              <Label htmlFor='cash'>
                                {t('payment.cash') || 'Cash'}
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='atm' id='atm' />
                              <Label htmlFor='atm'>
                                {t('payment.atm') || 'ATM'}
                              </Label>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <RadioGroupItem value='transfer' id='transfer' />
                              <Label htmlFor='transfer'>
                                {t('payment.transfer') || 'Transfer'}
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Button */}
                <div className='flex justify-start pt-6'>
                  <Button type='submit' disabled={isSubmitting} className='w-full sm:w-auto'>
                    {isSubmitting ? (t('button.creating') || 'Creating...') : (t('button.createOrder') || 'Create Order')}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
