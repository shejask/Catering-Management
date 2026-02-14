'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useInventoryCustomersStore, type InventoryProduct } from '@/stores/inventory-customers-store';

export function EditProductDialog({ product, onClose }: { product: InventoryProduct; onClose: () => void }) {
  const updateProduct = useInventoryCustomersStore((s) => s.updateProduct);
  const products = useInventoryCustomersStore((s) => s.products);
  const [productName, setProductName] = useState(product.productName);
  const [category, setCategory] = useState(product.category);
  const [quantity, setQuantity] = useState(product.quantity);

  useEffect(() => {
    setProductName(product.productName);
    setCategory(product.category);
    setQuantity(product.quantity);
  }, [product]);

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProduct(product.id, { productName: productName.trim(), category: category || 'Uncategorized', quantity });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground font-mono">Barcode: {product.barcodeId}</p>
          <div className="space-y-2">
            <Label htmlFor="edit-product-name">Product Name</Label>
            <Input
              id="edit-product-name"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category || undefined} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-quantity">Quantity</Label>
            <Input
              id="edit-quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 0)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
