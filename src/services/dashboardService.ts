
import { orderService, OrderData } from './orderService';

export interface DashboardKPIs {
  todayOrders: number;
  cookedOrders: number;
  completedOrders: number;
  upcomingOrders: number;
}

export interface OrderWithStatus extends OrderData {
  orderId: string;
  displayStatus: string;
  timeAgo: string;
}

export const dashboardService = {
  // Get today's date in YYYY-MM-DD format
  getTodayDate(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  },

  // Get tomorrow's date in YYYY-MM-DD format
  getTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  },

  // Check if a date is in the future (tomorrow or later)
  isUpcomingDate(dateString: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(dateString);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate > today;
  },

  // Calculate time ago from timestamp
  getTimeAgo(timestamp: string): string {
    const now = new Date();
    const orderTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  },

  // Get dashboard KPIs
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    try {
      const allOrders = await orderService.getAllOrders();
      const today = this.getTodayDate();

      const todayOrders = allOrders.filter(order => order.date === today);
      const upcomingOrders = allOrders.filter(order => this.isUpcomingDate(order.date));
      
      const cookedOrders = allOrders.filter(order => 
        order.cookStatus === 'preparing' || order.cookStatus === 'ready'
      );
      
      const completedOrders = allOrders.filter(order => 
        order.cookStatus === 'delivered'
      );

      return {
        todayOrders: todayOrders.length,
        cookedOrders: cookedOrders.length,
        completedOrders: completedOrders.length,
        upcomingOrders: upcomingOrders.length
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching dashboard KPIs:', error);
      return {
        todayOrders: 0,
        cookedOrders: 0,
        completedOrders: 0,
        upcomingOrders: 0
      };
    }
  },

  // Get today's orders
  async getTodayOrders(): Promise<OrderWithStatus[]> {
    try {
      const allOrders = await orderService.getAllOrders();
      const today = this.getTodayDate();
      
      return allOrders
        .filter(order => order.date === today && order.orderId)
        .map(order => ({
          ...order,
          orderId: order.orderId!,
          displayStatus: this.getDisplayStatus(order.cookStatus || 'pending'),
          timeAgo: order.createdAt ? this.getTimeAgo(order.createdAt) : 'Unknown'
        }))
        .sort((a, b) => {
          // Sort by creation time, newest first
          const timeA = new Date(a.createdAt || '').getTime();
          const timeB = new Date(b.createdAt || '').getTime();
          return timeB - timeA;
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching today orders:', error);
      return [];
    }
  },

  // Get upcoming orders (tomorrow and beyond)
  async getUpcomingOrders(): Promise<OrderWithStatus[]> {
    try {
      const allOrders = await orderService.getAllOrders();
      
      return allOrders
        .filter(order => this.isUpcomingDate(order.date) && order.orderId)
        .map(order => ({
          ...order,
          orderId: order.orderId!,
          displayStatus: this.getDisplayStatus(order.cookStatus || 'pending'),
          timeAgo: order.createdAt ? this.getTimeAgo(order.createdAt) : 'Unknown'
        }))
        .sort((a, b) => {
          // Sort by date first, then by creation time
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateA !== dateB) {
            return dateA - dateB; // Earlier dates first
          }
          // If dates are the same, sort by creation time, newest first
          const timeA = new Date(a.createdAt || '').getTime();
          const timeB = new Date(b.createdAt || '').getTime();
          return timeB - timeA;
        });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching upcoming orders:', error);
      return [];
    }
  },

  // Get display status for orders
  getDisplayStatus(cookStatus: string): string {
    switch (cookStatus) {
      case 'pending':
        return 'Pending';
      case 'preparing':
        return 'Preparing';
      case 'ready':
        return 'Ready';
      case 'delivered':
        return 'Delivered';
      default:
        return 'Pending';
    }
  },

  // Get status badge variant
  getStatusBadgeVariant(cookStatus: string): "default" | "secondary" | "outline" | "destructive" {
    switch (cookStatus) {
      case 'pending':
        return 'secondary';
      case 'preparing':
        return 'default';
      case 'ready':
        return 'outline';
      case 'delivered':
        return 'default';
      default:
        return 'secondary';
    }
  }
}; 