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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { stockService, CateringItem } from '@/services/stockService';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const stockInSchema = z.object({
  date: z.date(),
  supplier: z.string().optional(),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(0.001, "Quantity must be positive"),
  remarks: z.string().optional(),
});

type StockInFormValues = z.infer<typeof stockInSchema>;

export default function StockInPage() {
  const router = useRouter();
  const [items, setItems] = useState<CateringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CateringItem | null>(null);

  const form = useForm<StockInFormValues>({
    resolver: zodResolver(stockInSchema),
    defaultValues: {
      date: new Date(),
      supplier: '',
      itemId: '',
      quantity: 0,
      remarks: '',
    }
  });

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

  const onSubmit = async (values: StockInFormValues) => {
    if (!selectedItem) return;

    try {
      await stockService.logTransaction({
        date: format(values.date, 'yyyy-MM-dd'),
        type: 'IN',
        itemId: values.itemId,
        itemName: selectedItem.name,
        quantity: values.quantity,
        unit: selectedItem.unit,
        supplier: values.supplier,
        remarks: values.remarks,
        user: 'Admin' // TODO: Get actual user
      });
      
      toast.success("Stock received successfully");
      form.reset({
        date: new Date(),
        supplier: '',
        itemId: '',
        quantity: 0,
        remarks: ''
      });
      setSelectedItem(null);
    } catch (error) {
        console.error(error);
      toast.error("Failed to log transaction");
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <Heading title="Stock Receiving (IN)" description="Record new stock purchases" />
        <Separator />
        
        <div className="max-w-2xl mx-auto w-full">
             <Card>
                <CardHeader>
                    <CardTitle>Receive Stock</CardTitle>
                    <CardDescription>Enter details of the received items.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date > new Date() || date < new Date("1900-01-01")
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="supplier"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Supplier (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Supplier Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <FormLabel>Quantity Received {selectedItem ? `(${selectedItem.unit})` : ''}</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="remarks"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Remarks</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Any comments..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full md:w-auto">
                                <Icons.add className="mr-2 h-4 w-4" /> Receive Stock
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
