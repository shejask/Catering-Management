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
import { useInventoryCustomersStore } from '@/stores/inventory-customers-store';
import { IconPlus } from '@tabler/icons-react';

export function AddCustomerDialog() {
  const addCustomer = useInventoryCustomersStore((s) => s.addCustomer);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryRequiredDate, setDeliveryRequiredDate] = useState(() => new Date().toISOString().slice(0, 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addCustomer({
      name: name.trim(),
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
      deliveryRequiredDate
    });
    setName('');
    setAddress('');
    setPhone('');
    setDeliveryRequiredDate(new Date().toISOString().slice(0, 10));
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="touch-manipulation">
          <IconPlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Customer</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name (required)</Label>
            <Input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Customer name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-address">Address (optional)</Label>
            <Input
              id="customer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-phone">Phone (optional)</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="delivery-date">Delivery Required Date (required)</Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryRequiredDate}
              onChange={(e) => setDeliveryRequiredDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
