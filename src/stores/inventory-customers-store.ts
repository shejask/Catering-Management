'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InventoryProduct {
  id: string;
  barcodeId: string;
  productName: string;
  category: string;
  quantity: number;
  createdAt: string;
}

export interface InventoryCustomer {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  deliveryRequiredDate: string;
  createdAt: string;
}

export type AssignmentStatus = 'with_customer' | 'returned';

export interface ProductAssignment {
  id: string;
  barcodeId: string;
  productName: string;
  category: string;
  customerId: string;
  customerName: string;
  dateAssigned: string;
  status: AssignmentStatus;
  returnedAt?: string;
}

function generateBarcodeId(): string {
  return 'INV-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function generateId(): string {
  return crypto.randomUUID?.() ?? 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2);
}

interface InventoryCustomersState {
  products: InventoryProduct[];
  customers: InventoryCustomer[];
  assignments: ProductAssignment[];

  addProduct: (productName: string, category: string, quantity: number) => InventoryProduct;
  updateProduct: (id: string, data: Partial<Pick<InventoryProduct, 'productName' | 'category' | 'quantity'>>) => void;
  deleteProduct: (id: string) => void;
  getProductByBarcode: (barcodeId: string) => InventoryProduct | undefined;
  getProductById: (id: string) => InventoryProduct | undefined;

  addCustomer: (data: { name: string; address?: string; phone?: string; deliveryRequiredDate: string }) => InventoryCustomer;
  updateCustomer: (id: string, data: Partial<Omit<InventoryCustomer, 'id' | 'createdAt'>>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => InventoryCustomer | undefined;

  assignProductToCustomer: (barcodeId: string, customerId: string, dateAssigned: string) => boolean;
  returnProductToInventory: (barcodeId: string, customerId?: string) => boolean;
  getAssignmentsByCustomer: (customerId: string) => ProductAssignment[];
  getAssignmentByBarcode: (barcodeId: string) => ProductAssignment | undefined;
}

export const useInventoryCustomersStore = create<InventoryCustomersState>()(
  persist(
    (set, get) => ({
      products: [],
      customers: [],
      assignments: [],

      addProduct: (productName, category, quantity) => {
        const barcodeId = generateBarcodeId();
        const product: InventoryProduct = {
          id: generateId(),
          barcodeId,
          productName,
          category: category || 'Uncategorized',
          quantity,
          createdAt: new Date().toISOString()
        };
        set((s) => ({ products: [...s.products, product] }));
        return product;
      },

      updateProduct: (id, data) => {
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...data } : p))
        }));
      },

      deleteProduct: (id) => {
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          assignments: s.assignments.filter((a) => {
            const p = s.products.find((x) => x.id === id);
            return !p || a.barcodeId !== p.barcodeId;
          })
        }));
      },

      getProductByBarcode: (barcodeId) => {
        return get().products.find((p) => p.barcodeId === barcodeId);
      },

      getProductById: (id) => {
        return get().products.find((p) => p.id === id);
      },

      addCustomer: (data) => {
        const customer: InventoryCustomer = {
          id: generateId(),
          name: data.name,
          address: data.address,
          phone: data.phone,
          deliveryRequiredDate: data.deliveryRequiredDate,
          createdAt: new Date().toISOString()
        };
        set((s) => ({ customers: [...s.customers, customer] }));
        return customer;
      },

      updateCustomer: (id, data) => {
        set((s) => ({
          customers: s.customers.map((c) => (c.id === id ? { ...c, ...data } : c))
        }));
      },

      deleteCustomer: (id) => {
        set((s) => ({
          customers: s.customers.filter((c) => c.id !== id),
          assignments: s.assignments.filter((a) => a.customerId !== id)
        }));
      },

      getCustomerById: (id) => {
        return get().customers.find((c) => c.id === id);
      },

      assignProductToCustomer: (barcodeId, customerId, dateAssigned) => {
        const product = get().getProductByBarcode(barcodeId);
        const customer = get().getCustomerById(customerId);
        if (!product || !customer || product.quantity < 1) return false;

        const assignment: ProductAssignment = {
          id: generateId(),
          barcodeId: product.barcodeId,
          productName: product.productName,
          category: product.category,
          customerId: customer.id,
          customerName: customer.name,
          dateAssigned,
          status: 'with_customer'
        };
        set((s) => ({
          products: s.products.map((p) =>
            p.barcodeId === barcodeId ? { ...p, quantity: Math.max(0, p.quantity - 1) } : p
          ),
          assignments: [...s.assignments, assignment]
        }));
        return true;
      },

      returnProductToInventory: (barcodeId) => {
        const assignment = get().assignments.find(
          (a) => a.barcodeId === barcodeId && a.status === 'with_customer'
        );
        if (!assignment) return false;

        const returnedAt = new Date().toISOString();
        set((s) => ({
          products: s.products.map((p) =>
            p.barcodeId === barcodeId ? { ...p, quantity: p.quantity + 1 } : p
          ),
          assignments: s.assignments.map((a) =>
            a.id === assignment.id ? { ...a, status: 'returned' as const, returnedAt } : a
          )
        }));
        return true;
      },

      getAssignmentsByCustomer: (customerId) => {
        return get().assignments.filter((a) => a.customerId === customerId);
      },

      getAssignmentByBarcode: (barcodeId) => {
        return get().assignments.find((a) => a.barcodeId === barcodeId && a.status === 'with_customer');
      }
    }),
    { name: 'inventory-customers-storage' }
  )
);
