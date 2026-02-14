'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useInventoryCustomersStore, type InventoryProduct } from '@/stores/inventory-customers-store';
import { AddProductDialog } from './add-product-dialog';
import { downloadBarcodePDF } from '../lib/barcode-pdf';
import { ScanOutSheet } from './scan-out-sheet';
import { ScanInSheet } from './scan-in-sheet';
import { IconDotsVertical, IconPrinter, IconScan, IconEdit, IconTrash } from '@tabler/icons-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { EditProductDialog } from './edit-product-dialog';

export function InventorySection() {
  const products = useInventoryCustomersStore((s) => s.products);
  const deleteProduct = useInventoryCustomersStore((s) => s.deleteProduct);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedForBulkPrint, setSelectedForBulkPrint] = useState<Set<string>>(new Set());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<InventoryProduct | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats);
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.productName.toLowerCase().includes(search.toLowerCase()) ||
        p.barcodeId.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const handleBulkPrint = () => {
    if (selectedForBulkPrint.size === 0) {
      const toPrint = filtered.length ? filtered : products;
      downloadBarcodePDF(toPrint);
      return;
    }
    const toPrint = products.filter((p) => selectedForBulkPrint.has(p.id));
    if (toPrint.length) downloadBarcodePDF(toPrint);
  };

  const toggleSelect = (id: string) => {
    setSelectedForBulkPrint((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedForBulkPrint.size === filtered.length) setSelectedForBulkPrint(new Set());
    else setSelectedForBulkPrint(new Set(filtered.map((p) => p.id)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AddProductDialog />
          <Button variant="outline" size="sm" onClick={handleBulkPrint} className="touch-manipulation">
            <IconPrinter className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Bulk Print Barcode</span>
          </Button>
          <ScanOutSheet />
          <ScanInSheet />
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedForBulkPrint.size === filtered.length}
                  onChange={selectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Barcode ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No products. Add a product to get started.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedForBulkPrint.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.barcodeId}</TableCell>
                  <TableCell>{p.productName}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell className="text-right">{p.quantity}</TableCell>
                  <TableCell>
                    <Badge variant={p.quantity > 0 ? 'default' : 'destructive'}>
                      {p.quantity > 0 ? 'In stock' : 'Out'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => downloadBarcodePDF([p])}>
                          <IconPrinter className="mr-2 h-4 w-4" />
                          Print barcode
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingProduct(p)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(p.id)}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the product from inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) deleteProduct(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingProduct && (
        <EditProductDialog product={editingProduct} onClose={() => setEditingProduct(null)} />
      )}
    </div>
  );
}
