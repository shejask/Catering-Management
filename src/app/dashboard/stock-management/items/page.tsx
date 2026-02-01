'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { stockService, CateringItem, CATERING_CATEGORIES } from '@/services/stockService';
import { toast } from 'sonner';
import { Icons } from '@/components/icons';

const itemSchema = z.object({
  name: z.string().min(2, "Name is required"),
  nameAr: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  unitConversion: z.coerce.number().optional(),
  minStock: z.coerce.number().min(0, "Min stock must be positive"),
  isActive: z.boolean().default(true),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export default function ItemMasterPage() {
  const [items, setItems] = useState<CateringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CateringItem | null>(null);

  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: '',
      nameAr: '',
      category: '',
      unit: '',
      unitConversion: 0,
      minStock: 0,
      isActive: true,
    }
  });

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await stockService.getAllItems();
      setItems(data);
    } catch (error) {
      toast.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const onSubmit = async (values: ItemFormValues) => {
    try {
      if (editingItem) {
        await stockService.updateItem(editingItem.id, values);
        toast.success("Item updated successfully");
      } else {
        await stockService.addItem(values);
        toast.success("Item created successfully");
      }
      setIsSheetOpen(false);
      form.reset();
      setEditingItem(null);
      loadItems();
    } catch (error) {
      toast.error("Failed to save item");
    }
  };

  const handleEdit = (item: CateringItem) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      nameAr: item.nameAr || '',
      category: item.category,
      unit: item.unit,
      unitConversion: item.unitConversion || 0,
      minStock: item.minStock || 0,
      isActive: item.isActive,
    });
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    form.reset({
        name: '',
        nameAr: '',
        category: '',
        unit: '',
        unitConversion: 0,
        minStock: 0,
        isActive: true,
    });
    setIsSheetOpen(true);
  }

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Heading title="Item Master" description="Define your items here (e.g., Rice, Sugar). Note: Do not enter current stock quantity here; use 'Stock IN' for that." />
          <Button onClick={handleAddNew}>
            <Icons.add className="mr-2 h-4 w-4" /> Add New Item
          </Button>
        </div>
        <Separator />
        
        <Card>
            <CardHeader>
                <CardTitle>Items List</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Min Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                 <TableRow>
                                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                                 </TableRow>
                            ) : items.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No items found.</TableCell>
                                 </TableRow>
                            ) : (
                                items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.name}</span>
                                                <span className="text-xs text-muted-foreground">{item.nameAr}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
                                        <TableCell>{item.minStock}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.isActive ? "default" : "secondary"}>
                                                {item.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                                                <Icons.edit className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetContent className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</SheetTitle>
                    <SheetDescription>
                        {editingItem ? 'Update item details.' : 'Create a new stock item.'}
                    </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item Name (English)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Chicken" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="nameAr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Item Name (Arabic)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. دجاج" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                                {CATERING_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
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
                                                    <SelectItem value="KG">KG</SelectItem>
                                                    <SelectItem value="PCS">PCS</SelectItem>
                                                    <SelectItem value="Carton">Carton</SelectItem>
                                                    <SelectItem value="Box">Box</SelectItem>
                                                    <SelectItem value="Ltr">Ltr</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="minStock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Low Stock Alert Level</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="e.g. 5" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Alert me when stock drops below this amount. This is NOT the current quantity.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">Active Status</FormLabel>
                                        </div>
                                        <FormControl>
                                            <div className="flex items-center space-x-2">
                                                 <Checkbox 
                                                    checked={field.value} 
                                                    onCheckedChange={field.onChange}
                                                 />
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <SheetFooter>
                                <Button type="submit">{editingItem ? 'Update' : 'Create'}</Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </div>
            </SheetContent>
        </Sheet>
      </div>
    </PageContainer>
  );
}
