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
import { useInventoryCustomersStore, type InventoryCustomer } from '@/stores/inventory-customers-store';

export function EditCustomerDialog({ customer, onClose }: { customer: InventoryCustomer; onClose: () => void }) {
  const updateCustomer = useInventoryCustomersStore((s) => s.updateCustomer);
  const [name, setName] = useState(customer.name);
  const [address, setAddress] = useState(customer.address ?? '');
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [deliveryRequiredDate, setDeliveryRequiredDate] = useState(customer.deliveryRequiredDate);

  useEffect(() => {
    setName(customer.name);
    setAddress(customer.address ?? '');
    setPhone(customer.phone ?? '');
    setDeliveryRequiredDate(customer.deliveryRequiredDate);
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCustomer(customer.id, {
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      deliveryRequiredDate
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-customer-name">Customer Name</Label>
            <Input
              id="edit-customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address (optional)</Label>
            <Input
              id="edit-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone (optional)</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-delivery-date">Delivery Required Date</Label>
            <Input
              id="edit-delivery-date"
              type="date"
              value={deliveryRequiredDate}
              onChange={(e) => setDeliveryRequiredDate(e.target.value)}
              required
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
