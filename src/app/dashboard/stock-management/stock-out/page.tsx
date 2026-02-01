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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const stockOutSchema = z.object({
  date: z.date(),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.coerce.number().min(0.001, "Quantity must be positive"),
});

type StockOutFormValues = z.infer<typeof stockOutSchema>;

export default function StockOutPage() {
  const [items, setItems] = useState<CateringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<CateringItem | null>(null);
  const [currentStock, setCurrentStock] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Get user role from localStorage
    const authData = localStorage.getItem('auth_token');
    if (authData) {
      try {
        const { role } = JSON.parse(authData);
        setUserRole(role);
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);
  
  const form = useForm<StockOutFormValues>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      date: new Date(),
      itemId: '',
      quantity: 0,
    }
  });

  const watchedQuantity = form.watch('quantity');

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

  const onItemIdChange = async (itemId: string) => {
    const item = items.find(i => i.id === itemId) || null;
    setSelectedItem(item);
    form.setValue('itemId', itemId);
    
    if (itemId) {
        const stock = await stockService.getCurrentStock(itemId);
        setCurrentStock(stock);
    } else {
        setCurrentStock(null);
    }
  };

  const onSubmit = async (values: StockOutFormValues) => {
    if (!selectedItem || currentStock === null) return;

    if (values.quantity > currentStock) {
        toast.error(`Insufficient stock! Available: ${currentStock} ${selectedItem.unit}`);
        return;
    }

    try {
      await stockService.logTransaction({
        date: format(values.date, 'yyyy-MM-dd'),
        type: 'OUT',
        itemId: values.itemId,
        itemName: selectedItem.name,
        quantity: values.quantity,
        unit: selectedItem.unit,
        user: userRole || 'Admin' // Use actual role or fallback
      });
      
      toast.success("Consumption logged successfully");
      form.reset({
        date: new Date(),
        itemId: '',
        quantity: 0,
      });
      setSelectedItem(null);
      setCurrentStock(null);
    } catch (error) {
        console.error(error);
        toast.error("Failed to log consumption");
    }
  };

  const remainingStock = (currentStock !== null && watchedQuantity) 
    ? currentStock - watchedQuantity 
    : currentStock;

  const isNegative = remainingStock !== null && remainingStock < 0;

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <Heading title="Stock Consumption (OUT)" description="Record daily material usage" />
        <Separator />
        
        <div className="max-w-4xl mx-auto w-full">
            <div className="grid gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Log Consumption</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                                    disabled={(date) => {
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const isPast = date < today;
                                                        const isAdmin = userRole === 'manager' || userRole === 'admin';
                                                        
                                                        // Disable past dates for non-admins
                                                        if (isPast && !isAdmin) return true;
                                                        
                                                        // Always disable future dates and way past dates
                                                        return date > new Date() || date < new Date("1900-01-01");
                                                    }}
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
                                        <FormLabel>Quantity Used</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isNegative || !selectedItem}>
                                <Icons.minus className="mr-2 h-4 w-4" /> Log Consumption
                            </Button>
                        </form>
                    </Form>
                </CardContent>
             </Card>

             <div className="space-y-4">
                {selectedItem && currentStock !== null && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">Opening Stock</span>
                                <span className="font-bold text-lg">{currentStock} {selectedItem.unit}</span>
                            </div>
                            <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-muted-foreground">To Consume</span>
                                <span className="font-bold text-lg text-red-500">
                                    - {watchedQuantity || 0} {selectedItem.unit}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-muted-foreground">Remaining</span>
                                <span className={cn(
                                    "font-bold text-xl",
                                    isNegative ? "text-destructive" : "text-green-600"
                                )}>
                                    {remainingStock} {selectedItem.unit}
                                </span>
                            </div>
                            
                            {isNegative && (
                                <Alert variant="destructive">
                                    <Icons.warning className="h-4 w-4" />
                                    <AlertTitle>Error</AlertTitle>
                                    <AlertDescription>
                                        Cannot consume more than available stock.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                )}
             </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
