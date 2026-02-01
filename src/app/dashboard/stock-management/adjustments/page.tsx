'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { stockService, CateringItem } from '@/services/stockService';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const adjustmentSchema = z.object({
  type: z.enum(['DAMAGE', 'EXPIRY', 'CORRECTION']),
  action: z.enum(['ADD', 'REDUCE']),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(0.001, "Quantity must be positive"),
  reason: z.string().min(3, "Reason is mandatory"),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export default function StockAdjustmentPage() {
  const [items, setItems] = useState<CateringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CateringItem | null>(null);

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'CORRECTION',
      action: 'REDUCE',
      itemId: '',
      quantity: 0,
      reason: '',
    }
  });

  const watchType = form.watch('type');

  useEffect(() => {
    if (watchType === 'DAMAGE' || watchType === 'EXPIRY') {
        form.setValue('action', 'REDUCE');
    }
  }, [watchType, form]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await stockService.getAllItems();
        setItems(data.filter(i => i.isActive));
      } catch (error) {
        toast.error("Failed to load items");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const onItemIdChange = (itemId: string) => {
    const item = items.find(i => i.id === itemId) || null;
    setSelectedItem(item);
    form.setValue('itemId', itemId);
  };

  const onSubmit = async (values: AdjustmentFormValues) => {
    if (!selectedItem) return;

    // Calculate signed quantity
    const finalQuantity = values.action === 'REDUCE' ? -values.quantity : values.quantity;

    try {
      await stockService.logTransaction({
        date: new Date().toISOString().split('T')[0],
        type: 'ADJUSTMENT',
        itemId: values.itemId,
        itemName: selectedItem.name,
        quantity: finalQuantity,
        unit: selectedItem.unit,
        reason: `${values.type}: ${values.reason}`,
        user: 'Admin'
      });
      
      toast.success("Adjustment logged successfully");
      form.reset({
        type: 'CORRECTION',
        action: 'REDUCE',
        itemId: '',
        quantity: 0,
        reason: '',
      });
      setSelectedItem(null);
    } catch (error) {
        console.error(error);
        toast.error("Failed to log adjustment");
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <Heading title="Stock Adjustment" description="Correct stock levels (Damage, Expiry, etc.)" />
        <Separator />
        
        <div className="max-w-2xl mx-auto w-full">
             <Card>
                <CardHeader>
                    <CardTitle>Adjust Stock</CardTitle>
                    <CardDescription>Make manual corrections to stock levels.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adjustment Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="CORRECTION">Correction</SelectItem>
                                                <SelectItem value="DAMAGE">Damage</SelectItem>
                                                <SelectItem value="EXPIRY">Expiry</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="action"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>Action</FormLabel>
                                        <FormControl>
                                            <RadioGroup
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                                className="flex flex-col space-y-1"
                                                disabled={watchType === 'DAMAGE' || watchType === 'EXPIRY'}
                                            >
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="REDUCE" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Reduce Stock (-)
                                                    </FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-x-3 space-y-0">
                                                    <FormControl>
                                                        <RadioGroupItem value="ADD" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">
                                                        Add Stock (+)
                                                    </FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="itemId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item</FormLabel>
                                        <Select onValueChange={onItemIdChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Item" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {items.map(item => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name} ({item.unit})
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
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Reason (Mandatory)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Explain the adjustment..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={!selectedItem}>
                                <Icons.check className="mr-2 h-4 w-4" /> Save Adjustment
                            </Button>
                        </form>
                    </Form>
                </CardContent>
             </Card>
        </div>
      </div>
    </PageContainer>
  );
}
