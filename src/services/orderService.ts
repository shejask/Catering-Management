import { database } from '@/lib/firebase';
import { ref, push, set, get, update } from 'firebase/database';

export interface OrderData {
  name: string;
  receiptNo: string;
  date: string;
  time: string;
  phoneNumber: string;
  orderDetails: string;
  totalPayment: string;
  advancePayment: string;
  balancePayment?: string;
  discount?: string;
  location: string;
  paymentType: 'cash' | 'atm' | 'transfer';
  deliveryType: string;
  status?: 'paid' | 'unpaid';
  cookStatus?: 'pending' | 'preparing' | 'ready' | 'delivered';
  sharedToCook?: boolean;
  createdAt?: string;
  updatedAt?: string;
  orderId?: string;
}

export const orderService = {
  // Create a new order
  async createOrder(orderData: OrderData): Promise<string> {
    try {
      const ordersRef = ref(database, 'orders');
      const newOrderRef = push(ordersRef);
      
      const orderWithTimestamp = {
        ...orderData,
        status: orderData.status || 'unpaid',
        cookStatus: orderData.cookStatus || 'pending',
        sharedToCook: orderData.sharedToCook || false,
        balancePayment: orderData.balancePayment || '0',
        discount: orderData.discount || '0',
        createdAt: new Date().toISOString(),
        orderId: newOrderRef.key
      };

      await set(newOrderRef, orderWithTimestamp);
      return newOrderRef.key!;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating order:', error);
      throw new Error('Failed to create order');
    }
  },

  // Get all orders
  async getAllOrders(): Promise<OrderData[]> {
    try {
      const ordersRef = ref(database, 'orders');
      const snapshot = await get(ordersRef);
      
      if (snapshot.exists()) {
        const ordersData = snapshot.val();
        return Object.keys(ordersData).map(key => ({
          ...ordersData[key],
          orderId: key
        }));
      } else {
        return [];
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  },

  // Get a specific order by ID
  async getOrderById(orderId: string): Promise<OrderData | null> {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const snapshot = await get(orderRef);
      
      if (snapshot.exists()) {
        return {
          ...snapshot.val(),
          orderId
        };
      } else {
        return null;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching order:', error);
      throw new Error('Failed to fetch order');
    }
  },

  // Update an existing order
  async updateOrder(orderId: string, orderData: Partial<OrderData>): Promise<void> {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      const updateData = {
        ...orderData,
        updatedAt: new Date().toISOString()
      };
      
      await update(orderRef, updateData);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating order:', error);
      throw new Error('Failed to update order');
    }
  },

  // Delete an order
  async deleteOrder(orderId: string): Promise<void> {
    try {
      const orderRef = ref(database, `orders/${orderId}`);
      await set(orderRef, null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting order:', error);
      throw new Error('Failed to delete order');
    }
  }
};