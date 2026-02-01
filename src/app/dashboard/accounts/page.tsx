'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { financeService } from '@/services/financeService';
import { startOfDay, endOfDay } from 'date-fns';
import { Icons } from '@/components/icons';

export default function AccountsDashboard() {
  const [stats, setStats] = useState({
    todayExpense: 0,
    monthIncome: 0,
    outstandingCredit: 0,
    netProfit: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const today = new Date();
        
        // 1. Today's Expenses
        const todayExpenses = await financeService.getExpenses(startOfDay(today), endOfDay(today));
        const todayExpenseTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // 2. This Month's P&L (Income & Profit)
        const pnl = await financeService.getPnLReport(today);

        // 3. Outstanding Credit
        const creditCustomers = await financeService.getCreditCustomers();
        const totalCredit = creditCustomers.reduce((sum, cust) => sum + cust.outstandingBalance, 0);

        setStats({
          todayExpense: todayExpenseTotal,
          monthIncome: pnl.income.totalIncome,
          outstandingCredit: totalCredit,
          netProfit: pnl.netProfit
        });
      } catch (error) {
        console.error("Failed to load account stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    iconColor 
  }: { 
    title: string;
    value: number;
    icon: any;
    iconColor: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toFixed(3)} OMR</div>
      </CardContent>
    </Card>
  );

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Accounts & Finance Overview</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading stats...</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Today's Expense" 
              value={stats.todayExpense} 
              icon={Icons.receipt} 
              iconColor="text-red-500" 
            />
            <StatCard 
              title="This Month's Income" 
              value={stats.monthIncome} 
              icon={Icons.dollar} 
              iconColor="text-green-500" 
            />
            <StatCard 
              title="Total Outstanding Credit" 
              value={stats.outstandingCredit} 
              icon={Icons.users} 
              iconColor="text-orange-500" 
            />
            <StatCard 
              title="Net Profit (Current Month)" 
              value={stats.netProfit} 
              icon={Icons.trendingUp} 
              iconColor="text-blue-500" 
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}