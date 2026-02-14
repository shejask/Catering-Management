'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useInventoryCustomersStore } from '@/stores/inventory-customers-store';
import { downloadBarcodePDF } from '../lib/barcode-pdf';
import { IconPlus } from '@tabler/icons-react';

const DEFAULT_CATEGORIES = ['Equipment', 'Tableware', 'Linens', 'Decoration', 'Other'];

export function AddProductDialog() {
  const addProduct = useInventoryCustomersStore((s) => s.addProduct);
  const products = useInventoryCustomersStore((s) => s.products);
  const [open, setOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [categoryCustom, setCategoryCustom] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [printAfterSave, setPrintAfterSave] = useState(false);

  const categories = [...DEFAULT_CATEGORIES, ...products.map((p) => p.category).filter(Boolean)];
  const uniqueCategories = Array.from(new Set(categories));
  const finalCategory = category === 'Other' || !category ? categoryCustom || 'Uncategorized' : category;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) return;
    const product = addProduct(productName.trim(), finalCategory, Math.max(0, quantity));
    if (printAfterSave) {
      downloadBarcodePDF([product]);
    }
    setProductName('');
    setCategory('');
    setCategoryCustom('');
    setQuantity(1);
    setPrintAfterSave(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="touch-manipulation">
          <IconPlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Product</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product-name">Product Name (required)</Label>
            <Input
              id="product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Chafing Dish"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select or type below" />
              </SelectTrigger>
              <SelectContent>
                {uniqueCategories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {(category === 'Other' || !category) && (
              <Input
                placeholder="Category name"
                value={categoryCustom}
                onChange={(e) => setCategoryCustom(e.target.value)}
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Barcode will be auto-generated on save.</p>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="print-barcode"
              checked={printAfterSave}
              onCheckedChange={(v) => setPrintAfterSave(!!v)}
            />
            <Label htmlFor="print-barcode" className="text-sm font-normal cursor-pointer">
              Print barcode after saving
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!productName.trim()}>
              Save Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
