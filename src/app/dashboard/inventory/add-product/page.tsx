'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { inventoryService, PRODUCT_CATEGORIES } from '@/services/inventoryService';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.'
  }),
  quantity: z.coerce.number().min(0, {
    message: 'Quantity must be positive.'
  }),
  price: z.coerce.number().min(0).optional(),
  barcode: z.string().optional(),
  unit: z.string().min(1, { message: 'Unit is required' }),
  category: z.string().optional()
});

function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('id');
  const isEditMode = !!productId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      quantity: 1,
      price: 0,
      barcode: '',
      unit: 'PCS',
      category: 'Others'
    }
  });

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        try {
          const product = await inventoryService.getProductById(productId);
          if (product) {
            form.reset({
              name: product.name,
              quantity: product.quantity,
              price: product.price || 0,
              barcode: product.barcode || '',
              unit: product.unit || 'PCS',
              category: product.category || 'Others'
            });
          }
        } catch (error) {
          console.error(error);
          toast.error('Failed to load product details');
        }
      };
      fetchProduct();
    }
  }, [productId, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (isEditMode && productId) {
        await inventoryService.updateProduct(productId, values);
        toast.success('Product updated successfully!');
      } else {
        await inventoryService.addProduct({
          ...values,
          isActive: true
        });
        toast.success('Product added successfully!');
      }
      router.push('/dashboard/inventory');
    } catch (error) {
      console.error(error);
      toast.error(isEditMode ? 'Failed to update product' : 'Failed to add product');
    }
  }

  function handlePrintBarcode() {
    const values = form.getValues();
    if (!values.name) {
      toast.error('Please enter a product name first.');
      return;
    }
    const barcode = values.barcode || 'Generated-' + Date.now();
    
    // Mock printing logic - in real app, use jsPDF or similar
    toast.info(`Printing barcode: ${barcode} for ${values.name}`);
  }

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title={isEditMode ? 'Edit Product' : 'Add Product'}
            description={isEditMode ? 'Edit product details' : 'Add a new product to the inventory'}
          />
        </div>
        <Separator />
        <Card className='mx-auto w-full max-w-2xl'>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Enter the product name, quantity, and other details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-8'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter product name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {['PCS', 'KG', 'GM', 'LITRE', 'BOX', 'CARTON', 'PACK'].map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name='quantity'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='Enter quantity'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='price'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (OMR)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step="0.001"
                            placeholder='Enter price'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name='barcode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='Scan or enter barcode' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className='flex gap-4'>
                  <Button type='submit'>{isEditMode ? 'Update Product' : 'Add Product'}</Button>
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={handlePrintBarcode}
                  >
                    Print Barcode
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

export default function AddProductPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductForm />
    </Suspense>
  );
}
