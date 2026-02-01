import { database } from '@/lib/firebase';
import { ref, push, set, get, update, query, orderByChild, equalTo } from 'firebase/database';

export interface CateringItem {
  id: string;
  name: string; // English Name
  nameAr?: string; // Arabic Name
  category: string;
  unit: string; // Single Unit Type (KG / PCS / Carton)
  unitConversion?: number; // Optional: 1 Carton = X PCS
  minStock: number; // Alert level
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CATERING_CATEGORIES = [
  'Vegetables',
  'Grocery',
  'Meat',
  'Frozen Items',
  'Aluminium / Packing',
  'Spices',
  'Others'
];

export interface CateringTransaction {
  id: string;
  date: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  itemId: string;
  itemName: string;
  quantity: number; // For OUT this is consumption, for IN this is received
  unit: string;
  reason?: string; // For adjustment
  supplier?: string; // For IN
  remarks?: string; // For IN
  user?: string; // User who performed action
  openingStock?: number; // Snapshot for audit
  remainingStock?: number; // Snapshot for audit
  createdAt: string;
}

export const stockService = {
  // --- Items ---

  async addItem(data: Omit<CateringItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const itemsRef = ref(database, 'catering_items');
    const newItemRef = push(itemsRef);
    const id = newItemRef.key;
    const now = new Date().toISOString();

    const itemData: CateringItem = {
      ...data,
      id: id!,
      createdAt: now,
      updatedAt: now
    };

    await set(newItemRef, itemData);
    return id;
  },

  async updateItem(id: string, data: Partial<CateringItem>) {
    const itemRef = ref(database, `catering_items/${id}`);
    const now = new Date().toISOString();
    await update(itemRef, {
      ...data,
      updatedAt: now
    });
  },

  async getAllItems(): Promise<CateringItem[]> {
    const itemsRef = ref(database, 'catering_items');
    const snapshot = await get(itemsRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.values(data);
    }
    return [];
  },

  async getItemById(id: string): Promise<CateringItem | null> {
    const itemRef = ref(database, `catering_items/${id}`);
    const snapshot = await get(itemRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  // --- Transactions & Stock Logic ---

  async getCurrentStock(itemId: string): Promise<number> {
    // This function calculates current stock by aggregating transactions
    // In a real production app, we should store a denormalized 'currentStock' in the item record for performance
    // For now, let's assume we store it in a separate 'catering_stock' node or just calculate it
    // To match the requirements efficiently, I will modify this to read from a 'catering_stock' node
    
    const stockRef = ref(database, `catering_stock/${itemId}`);
    const snapshot = await get(stockRef);
    return snapshot.exists() ? snapshot.val() : 0;
  },
  
  // Helper to update current stock
  async updateStockCount(itemId: string, change: number) {
    const stockRef = ref(database, `catering_stock/${itemId}`);
    const snapshot = await get(stockRef);
    const current = snapshot.exists() ? snapshot.val() : 0;
    const newStock = current + change;
    await set(stockRef, newStock);
    return newStock;
  },

  async logTransaction(transaction: Omit<CateringTransaction, 'id' | 'createdAt'>) {
    const transactionRef = ref(database, 'catering_transactions');
    const newTransactionRef = push(transactionRef);
    const id = newTransactionRef.key;
    const now = new Date().toISOString();

    // Calculate opening and remaining stock for the record
    const currentStock = await this.getCurrentStock(transaction.itemId);
    
    // Validate negative stock for consumption
    if (transaction.type === 'OUT' && currentStock < transaction.quantity) {
        throw new Error(`Insufficient stock. Current: ${currentStock}, Requested: ${transaction.quantity}`);
    }

    let stockChange = 0;
    if (transaction.type === 'IN') {
        stockChange = transaction.quantity;
    } else if (transaction.type === 'OUT') {
        stockChange = -transaction.quantity;
    } else if (transaction.type === 'ADJUSTMENT') {
        // Adjustment logic might need to be smarter (e.g., set to specific value or add/subtract)
        // Assuming adjustment quantity is the CHANGE amount (can be negative)
        stockChange = transaction.quantity; 
    }

    const newStock = await this.updateStockCount(transaction.itemId, stockChange);

    const transactionData: CateringTransaction = {
      ...transaction,
      id: id!,
      openingStock: currentStock,
      remainingStock: newStock,
      createdAt: now
    };

    await set(newTransactionRef, transactionData);
    return id;
  },

  async getTransactions(filters?: { startDate?: string; endDate?: string; type?: string; itemId?: string }): Promise<CateringTransaction[]> {
    const transactionsRef = ref(database, 'catering_transactions');
    // Basic implementation: fetch all and filter in memory (efficient enough for small-medium scale)
    const snapshot = await get(transactionsRef);
    if (snapshot.exists()) {
      let transactions = Object.values(snapshot.val()) as CateringTransaction[];
      
      if (filters) {
        if (filters.startDate) {
          transactions = transactions.filter(t => t.date >= filters.startDate!);
        }
        if (filters.endDate) {
          transactions = transactions.filter(t => t.date <= filters.endDate!);
        }
        if (filters.type) {
          transactions = transactions.filter(t => t.type === filters.type);
        }
        if (filters.itemId) {
            transactions = transactions.filter(t => t.itemId === filters.itemId);
        }
      }
      return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return [];
  },
  
  async getStockSnapshot(): Promise<Record<string, number>> {
      const stockRef = ref(database, 'catering_stock');
      const snapshot = await get(stockRef);
      return snapshot.exists() ? snapshot.val() : {};
  }
};
