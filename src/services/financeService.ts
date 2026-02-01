import { database } from '@/lib/firebase';
import { ref, push, set, get, remove, update } from 'firebase/database';
import { orderService } from './orderService';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export interface Expense {
  id: string;
  date: string;
  category: string;
  subCategory?: string;
  description: string; // Used for "Notes"
  amount: number;
  paymentMode: 'cash' | 'bank' | 'upi';
  createdAt: string;
}

export interface CounterSale {
  id: string;
  date: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface ManualCredit {
  id: string;
  date: string;
  customerName: string;
  phoneNumber: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface IncomeRecord {
  orderId: string;
  customerName: string;
  date: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'paid' | 'partial' | 'unpaid';
  phoneNumber?: string;
}

export interface CreditCustomer {
  phoneNumber: string;
  name: string;
  totalCredit: number;
  totalPaid: number;
  outstandingBalance: number;
  orders: IncomeRecord[];
  manualCredits: ManualCredit[];
}

export interface PnLReport {
  month: string;
  income: {
    counterSales: number;
    orderSales: number;
    totalIncome: number;
  };
  creditAmount: number;
  netIncome: number;
  expenses: {
    total: number;
    breakdown: Record<string, number>;
  };
  netProfit: number;
}

export const financeService = {
  // --- Expenses ---

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<string> {
    const expensesRef = ref(database, 'finance_expenses');
    const newExpenseRef = push(expensesRef);
    const expenseData = {
      ...expense,
      createdAt: new Date().toISOString(),
      id: newExpenseRef.key || ''
    };
    await set(newExpenseRef, expenseData);
    return newExpenseRef.key || '';
  },

  async getExpenses(startDate?: Date, endDate?: Date): Promise<Expense[]> {
    const expensesRef = ref(database, 'finance_expenses');
    const snapshot = await get(expensesRef);
    
    if (!snapshot.exists()) return [];

    const expenses: Expense[] = [];
    snapshot.forEach((child) => {
      const expense = child.val() as Expense;
      expense.id = child.key || '';
      
      if (startDate && endDate) {
        try {
          const expenseDate = parseISO(expense.date);
          if (isWithinInterval(expenseDate, { start: startDate, end: endDate })) {
            expenses.push(expense);
          }
        } catch (error) {
          console.error('Invalid date format for expense:', expense.id, error);
        }
      } else {
        expenses.push(expense);
      }
    });

    return expenses.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        return 0;
      }
    });
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<void> {
    const expenseRef = ref(database, `finance_expenses/${id}`);
    await update(expenseRef, updates);
  },

  async deleteExpense(id: string): Promise<void> {
    const expenseRef = ref(database, `finance_expenses/${id}`);
    await remove(expenseRef);
  },

  // --- Counter Sales (Daily Income) ---

  async addCounterSale(sale: Omit<CounterSale, 'id' | 'createdAt'>): Promise<string> {
    const refPath = ref(database, 'finance_counter_sales');
    const newRef = push(refPath);
    const data = {
      ...sale,
      createdAt: new Date().toISOString(),
      id: newRef.key || ''
    };
    await set(newRef, data);
    return newRef.key || '';
  },

  async getCounterSales(startDate?: Date, endDate?: Date): Promise<CounterSale[]> {
    const refPath = ref(database, 'finance_counter_sales');
    const snapshot = await get(refPath);
    if (!snapshot.exists()) return [];

    const sales: CounterSale[] = [];
    snapshot.forEach((child) => {
      const sale = child.val() as CounterSale;
      sale.id = child.key || '';
      if (startDate && endDate) {
        try {
          const date = parseISO(sale.date);
          if (isWithinInterval(date, { start: startDate, end: endDate })) {
            sales.push(sale);
          }
        } catch (error) {
          console.error('Invalid date format for counter sale:', sale.id, error);
        }
      } else {
        sales.push(sale);
      }
    });
    return sales.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        return 0;
      }
    });
  },

  async deleteCounterSale(id: string): Promise<void> {
    const refPath = ref(database, `finance_counter_sales/${id}`);
    await remove(refPath);
  },

  // --- Manual Credits ---

  async addManualCredit(credit: Omit<ManualCredit, 'id' | 'createdAt'>): Promise<string> {
    const refPath = ref(database, 'finance_manual_credits');
    const newRef = push(refPath);
    const data = {
      ...credit,
      createdAt: new Date().toISOString(),
      id: newRef.key || ''
    };
    await set(newRef, data);
    return newRef.key || '';
  },

  async getManualCredits(startDate?: Date, endDate?: Date): Promise<ManualCredit[]> {
    const refPath = ref(database, 'finance_manual_credits');
    const snapshot = await get(refPath);
    if (!snapshot.exists()) return [];

    const credits: ManualCredit[] = [];
    snapshot.forEach((child) => {
      const c = child.val() as ManualCredit;
      c.id = child.key || '';
      if (startDate && endDate) {
        try {
          const date = parseISO(c.date);
          if (isWithinInterval(date, { start: startDate, end: endDate })) {
            credits.push(c);
          }
        } catch (error) {
          console.error('Invalid date format for manual credit:', c.id, error);
        }
      } else {
        credits.push(c);
      }
    });
    return credits;
  },

  // --- Income (Derived from Orders) ---

  async getIncomeRecords(startDate?: Date, endDate?: Date): Promise<IncomeRecord[]> {
    const orders = await orderService.getAllOrders();
    
    const incomeRecords = orders.map(order => {
      const total = parseFloat(order.totalPayment || '0');
      const advance = parseFloat(order.advancePayment || '0');
      
      let paid = advance;
      if (order.status === 'paid') {
        paid = total;
      }

      const calculatedBalance = total - paid;

      return {
        orderId: order.orderId || '',
        customerName: order.name || '',
        date: order.date || '',
        totalAmount: total,
        paidAmount: paid,
        balanceAmount: calculatedBalance,
        status: calculatedBalance <= 0 ? 'paid' : (paid > 0 ? 'partial' : 'unpaid'),
        phoneNumber: order.phoneNumber
      } as IncomeRecord;
    });

    if (startDate && endDate) {
      return incomeRecords.filter(record => {
        try {
          const recordDate = parseISO(record.date);
          return isWithinInterval(recordDate, { start: startDate, end: endDate });
        } catch (e) {
          console.error('Invalid date format for income record:', record.orderId, e);
          return false;
        }
      });
    }

    return incomeRecords.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch (error) {
        return 0;
      }
    });
  },

  // --- Credit Management ---

  async getCreditCustomers(): Promise<CreditCustomer[]> {
    const incomeRecords = await this.getIncomeRecords();
    const manualCredits = await this.getManualCredits();
    
    const customerMap = new Map<string, CreditCustomer>();

    // 1. Process Order Credits
    incomeRecords.forEach(record => {
      if (record.balanceAmount > 0) {
        const key = record.phoneNumber || record.customerName; 
        
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            phoneNumber: record.phoneNumber || '',
            name: record.customerName,
            totalCredit: 0,
            totalPaid: 0,
            outstandingBalance: 0,
            orders: [],
            manualCredits: []
          });
        }

        const customer = customerMap.get(key)!;
        customer.orders.push(record);
        customer.totalCredit += record.totalAmount;
        customer.totalPaid += record.paidAmount;
        customer.outstandingBalance += record.balanceAmount;
      }
    });

    // 2. Process Manual Credits
    manualCredits.forEach(credit => {
      const key = credit.phoneNumber || credit.customerName;
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          phoneNumber: credit.phoneNumber,
          name: credit.customerName,
          totalCredit: 0,
          totalPaid: 0,
          outstandingBalance: 0,
          orders: [],
          manualCredits: []
        });
      }
      const customer = customerMap.get(key)!;
      customer.manualCredits.push(credit);
      customer.totalCredit += credit.amount;
      customer.outstandingBalance += credit.amount;
    });

    return Array.from(customerMap.values());
  },

  // --- P&L Report ---

  async getPnLReport(month: Date): Promise<PnLReport> {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    const expenses = await this.getExpenses(start, end);
    const incomeRecords = await this.getIncomeRecords(start, end);
    const counterSales = await this.getCounterSales(start, end);
    const manualCredits = await this.getManualCredits(start, end);

    // A. Income Section
    const totalOrderSale = incomeRecords.reduce((sum, inc) => sum + inc.totalAmount, 0);
    const totalCounterSale = counterSales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalIncome = totalOrderSale + totalCounterSale;

    // Credit Amount
    const orderCredit = incomeRecords.reduce((sum, inc) => sum + inc.balanceAmount, 0);
    const manualCreditTotal = manualCredits.reduce((sum, c) => sum + c.amount, 0);
    const totalCreditAmount = orderCredit + manualCreditTotal;

    // Net Income
    const netIncome = totalIncome - totalCreditAmount;

    // B. Expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseBreakdown: Record<string, number> = {};
    expenses.forEach(exp => {
      expenseBreakdown[exp.category] = (expenseBreakdown[exp.category] || 0) + exp.amount;
    });

    // C. Net Profit
    const netProfit = netIncome - totalExpenses;

    return {
      month: format(month, 'yyyy-MM'),
      income: {
        counterSales: totalCounterSale,
        orderSales: totalOrderSale,
        totalIncome
      },
      creditAmount: totalCreditAmount,
      netIncome,
      expenses: {
        total: totalExpenses,
        breakdown: expenseBreakdown
      },
      netProfit
    };
  },

  async recordPayment(orderId: string, amountPaid: number): Promise<void> {
    const order = await orderService.getOrderById(orderId);
    if (!order) throw new Error("Order not found");

    const total = parseFloat(order.totalPayment || '0');
    const currentPaid = parseFloat(order.advancePayment || '0'); 
    
    const newPaid = currentPaid + amountPaid;
    const newBalance = total - newPaid;

    await orderService.updateOrder(orderId, {
      advancePayment: newPaid.toString(),
      balancePayment: newBalance.toString(),
      status: newBalance <= 0 ? 'paid' : 'unpaid'
    });
  }
};