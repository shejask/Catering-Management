import { database } from '@/lib/firebase';
import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';

export interface Product {
  id: string;
  name: string;
  nameAr?: string; // Arabic Name
  quantity: number;
  barcode?: string;
  price?: number;
  category?: string;
  description?: string;
  unit: string; // Single Unit Type (KG / PCS / Carton)
  unitConversion?: number; // Optional: 1 Carton = X PCS
  minStock?: number; // Alert level
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PRODUCT_CATEGORIES = [
  'Vegetables',
  'Grocery',
  'Meat',
  'Frozen Items',
  'Aluminium / Packing',
  'Spices',
  'Others'
];

export interface StockTransaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DISPATCH';
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  reason?: string; // For adjustment
  supplier?: string; // For IN
  user?: string; // User who performed action
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  deliveryDate?: string;
  createdAt: string;
  scannedItems?: { productId: string; quantity: number }[];
}

export interface ProductAllocation {
  customerId: string;
  customerName: string;
  quantity: number;
}

export const inventoryService = {
  // --- Products ---

  async addProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const productsRef = ref(database, 'products');
    const newProductRef = push(productsRef);
    const id = newProductRef.key;
    const now = new Date().toISOString();

    const productData: Product = {
      ...data,
      id: id!,
      createdAt: now,
      updatedAt: now
    };

    await set(newProductRef, productData);
    return id;
  },

  async getAllProducts(): Promise<Product[]> {
    const productsRef = ref(database, 'products');
    const snapshot = await get(productsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  },

  async getProductById(id: string): Promise<Product | null> {
    const productRef = ref(database, `products/${id}`);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  async getProductByBarcode(barcode: string): Promise<Product | null> {
    const productsRef = ref(database, 'products');
    // Note: This requires indexing on 'barcode' in Firebase rules for performance with large datasets
    // For small datasets, client-side filtering or this query is fine
    const q = query(productsRef, orderByChild('barcode'), equalTo(barcode));
    const snapshot = await get(q);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const key = Object.keys(data)[0];
      return data[key];
    }
    return null;
  },

  async getProductAllocations(productId: string): Promise<ProductAllocation[]> {
    const customersRef = ref(database, 'customers');
    const snapshot = await get(customersRef);
    const allocations: ProductAllocation[] = [];

    if (snapshot.exists()) {
      const customers = snapshot.val();
      Object.values(customers).forEach((customer: any) => {
        if (customer.scannedItems) {
          const item = customer.scannedItems.find((i: any) => i.productId === productId);
          if (item) {
            allocations.push({
              customerId: customer.id,
              customerName: customer.name,
              quantity: item.quantity
            });
          }
        }
      });
    }
    return allocations;
  },

  async updateProductQuantity(id: string, newQuantity: number) {
    const productRef = ref(database, `products/${id}`);
    await update(productRef, {
      quantity: newQuantity,
      updatedAt: new Date().toISOString()
    });
  },

  async adjustStock(id: string, adjustment: number) {
    const productRef = ref(database, `products/${id}`);
    const snapshot = await get(productRef);
    if (snapshot.exists()) {
      const currentQty = snapshot.val().quantity || 0;
      await update(productRef, {
        quantity: currentQty + adjustment,
        updatedAt: new Date().toISOString()
      });
    }
  },

  async logTransaction(transaction: Omit<StockTransaction, 'id' | 'createdAt'>) {
    const transactionRef = ref(database, 'stock_transactions');
    const newTransactionRef = push(transactionRef);
    const id = newTransactionRef.key;
    const now = new Date().toISOString();

    const transactionData: StockTransaction = {
      ...transaction,
      id: id!,
      createdAt: now
    };

    await set(newTransactionRef, transactionData);
    return id;
  },

  async getTransactions(): Promise<StockTransaction[]> {
    const transactionRef = ref(database, 'stock_transactions');
    const snapshot = await get(transactionRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  },

  async updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>) {
    const productRef = ref(database, `products/${id}`);
    await update(productRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  },

  async deleteProduct(id: string) {
    const productRef = ref(database, `products/${id}`);
    await remove(productRef);
  },

  // --- Customers ---

  async addCustomer(data: Omit<Customer, 'id' | 'createdAt'>) {
    const customersRef = ref(database, 'customers');
    const newCustomerRef = push(customersRef);
    const id = newCustomerRef.key;
    
    const customerData: Customer = {
      ...data,
      id: id!,
      createdAt: new Date().toISOString()
    };
    
    await set(newCustomerRef, customerData);
    return id;
  },

  async updateCustomer(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'createdAt'>>) {
    const customerRef = ref(database, `customers/${id}`);
    await update(customerRef, data);
  },

  async deleteCustomer(id: string) {
    const customerRef = ref(database, `customers/${id}`);
    await remove(customerRef);
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const customerRef = ref(database, `customers/${id}`);
    const snapshot = await get(customerRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  async getAllCustomers(): Promise<Customer[]> {
    const customersRef = ref(database, 'customers');
    const snapshot = await get(customersRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  },

  async updateCustomerItems(customerId: string, items: { productId: string; quantity: number }[]) {
    const customerRef = ref(database, `customers/${customerId}`);
    await update(customerRef, {
      scannedItems: items
    });
  },

  async dispatchCustomerItem(customerId: string, productId: string, quantity: number) {
    const customerRef = ref(database, `customers/${customerId}`);
    const snapshot = await get(customerRef);
    
    if (snapshot.exists()) {
      const customer = snapshot.val() as Customer;
      let currentItems = customer.scannedItems || [];
      
      // 1. Subtract from main inventory
      await this.adjustStock(productId, -quantity);
      
      // 2. Add to customer items
      const existingItemIndex = currentItems.findIndex(item => item.productId === productId);
      if (existingItemIndex !== -1) {
        currentItems[existingItemIndex].quantity += quantity;
      } else {
        currentItems.push({ productId, quantity });
      }
      
      // Update customer record
      await update(customerRef, {
        scannedItems: currentItems
      });
    }
  },

  async returnCustomerItems(customerId: string, returnedItems: { productId: string; quantity: number }[]) {
    const customerRef = ref(database, `customers/${customerId}`);
    const snapshot = await get(customerRef);
    
    if (snapshot.exists()) {
      const customer = snapshot.val() as Customer;
      let currentItems = customer.scannedItems || [];
      
      // Update inventory and customer items
      for (const returnedItem of returnedItems) {
        // 1. Add back to main inventory
        await this.adjustStock(returnedItem.productId, returnedItem.quantity);
        
        // 2. Subtract from customer items
        const existingItemIndex = currentItems.findIndex(item => item.productId === returnedItem.productId);
        if (existingItemIndex !== -1) {
          currentItems[existingItemIndex].quantity -= returnedItem.quantity;
          if (currentItems[existingItemIndex].quantity <= 0) {
            currentItems.splice(existingItemIndex, 1);
          }
        }
      }
      
      // Update customer record
      await update(customerRef, {
        scannedItems: currentItems
      });
    }
  }
};
