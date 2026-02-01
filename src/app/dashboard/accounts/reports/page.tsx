'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { financeService, PnLReport } from '@/services/financeService';
import { format, parseISO } from 'date-fns';
import { Icons } from '@/components/icons';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IconTrendingUp, IconTrendingDown, IconCurrencyDollar, IconReceipt, IconCalendar, IconFileText } from '@tabler/icons-react';

export default function PnLReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [report, setReport] = useState<PnLReport | null>(null);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const date = parseISO(selectedMonth + '-01');
      const data = await financeService.getPnLReport(date);
      setReport(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate P&L report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedMonth]);

  const handleExportPDF = async () => {
    if (!report) return;
    const toastId = toast.loading("Generating PDF...");
    
    try {
      const jsPDF = (await import('jspdf')).default;
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("ALMAKAREM KITCHEN", 105, 15, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`Monthly Profit & Loss Statement - ${report.month}`, 105, 25, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text("Financial Summary", 14, 40);
      
      autoTable(doc, {
        startY: 45,
        head: [['Description', 'Amount (OMR)']],
        body: [
          ['Total Income (Orders)', report.income.totalIncome.toFixed(3)],
          ['Total Expenses', report.expenses.total.toFixed(3)],
          ['NET PROFIT / LOSS', report.netProfit.toFixed(3)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
      });

      const finalY = (doc as any).lastAutoTable.finalY || 80;
      doc.text("Expense Breakdown", 14, finalY + 15);

      const expenseBody = Object.entries(report.expenses.breakdown).sort(([,a], [,b]) => b - a).map(([cat, amount]) => [
        cat, amount.toFixed(3)
      ]);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Category', 'Amount (OMR)']],
        body: expenseBody,
        theme: 'grid',
        headStyles: { fillColor: [100, 100, 100] },
        columnStyles: { 1: { halign: 'right' } }
      });

      doc.save(`PnL-Report-${report.month}.pdf`);
      toast.success("PDF exported", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to export PDF", { id: toastId });
    }
  };

  const profitMargin = report ? (report.income.totalIncome > 0 ? (report.netProfit / report.income.totalIncome) * 100 : 0) : 0;

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Profit & Loss Report</h1>
            <p className="text-muted-foreground mt-2">Monthly financial performance analysis</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <IconCalendar className="h-4 w-4" /> Select Month
              </Label>
              <Input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full sm:w-[200px]" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium opacity-0 hidden sm:block">Action</Label>
              <Button onClick={handleExportPDF} disabled={!report} size="lg" className="w-full sm:w-auto">
                <IconFileText className="mr-2 h-5 w-5" /> Export PDF
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-20">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <p className="text-muted-foreground text-lg">Calculating financials...</p>
              </div>
            </CardContent>
          </Card>
        ) : report ? (
          <>
            {/* Key Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                  <IconTrendingUp className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{report.income.totalIncome.toFixed(3)} OMR</div>
                  <p className="text-xs text-muted-foreground mt-2">Revenue from orders</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                  <IconTrendingDown className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{report.expenses.total.toFixed(3)} OMR</div>
                  <p className="text-xs text-muted-foreground mt-2">All operating costs</p>
                </CardContent>
              </Card>

              <Card className={`border-l-4 ${report.netProfit >= 0 ? 'border-l-blue-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30' : 'border-l-orange-500 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30'}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className={`text-sm font-medium ${report.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    Net {report.netProfit >= 0 ? 'Profit' : 'Loss'}
                  </CardTitle>
                  <IconCurrencyDollar className={`h-5 w-5 ${report.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${report.netProfit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-orange-700 dark:text-orange-400'}`}>
                    {report.netProfit.toFixed(3)} OMR
                  </div>
                  <p className={`text-xs mt-2 ${report.netProfit >= 0 ? 'text-blue-600 dark:text-blue-500' : 'text-orange-600 dark:text-orange-500'}`}>
                    Bottom line result
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Profit Margin</CardTitle>
                  <IconReceipt className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${profitMargin >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
                    {profitMargin.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Return on revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Report */}
            <Card 
              className="shadow-lg" 
              ref={componentRef}
              style={{
                '--background': '#ffffff',
                '--foreground': '#000000',
                '--card': '#ffffff',
                '--card-foreground': '#000000',
                '--popover': '#ffffff',
                '--popover-foreground': '#000000',
                '--primary': '#000000',
                '--primary-foreground': '#ffffff',
                '--secondary': '#f3f4f6',
                '--secondary-foreground': '#000000',
                '--muted': '#f3f4f6',
                '--muted-foreground': '#6b7280',
                '--accent': '#f3f4f6',
                '--accent-foreground': '#000000',
                '--destructive': '#ef4444',
                '--border': '#e5e7eb',
                '--input': '#e5e7eb',
                '--ring': '#000000',
                '--radius': '0.5rem',
              } as React.CSSProperties}
            >
              <CardContent className="p-8 bg-white text-black">
                {/* Report Header */}
                <div className="mb-8 text-center border-b-2 border-gray-300 pb-6">
                  <h1 className="text-3xl font-bold uppercase tracking-wide text-black">Almakarem Kitchen</h1>
                  <p className="text-gray-600 text-sm mt-1">Catering Management System</p>
                  <h2 className="text-2xl font-semibold mt-6 text-black">
                    Profit & Loss Statement
                  </h2>
                  <p className="text-base text-gray-700 mt-2 font-medium">Period: {report.month}</p>
                </div>

                {/* Financial Summary */}
                <div className="mb-10">
                  <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-black text-black">Financial Summary</h3>
                  <div className="overflow-hidden rounded-lg border-2 border-gray-300">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-100 border-b-2 border-black hover:bg-gray-100">
                          <TableHead className="text-black font-bold text-base py-4">Description</TableHead>
                          <TableHead className="text-right text-black font-bold text-base py-4">Amount (OMR)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-b border-gray-300 hover:bg-gray-50">
                          <TableCell className="font-semibold text-black py-4">Total Income (Orders)</TableCell>
                          <TableCell className="text-right font-bold text-green-700 text-lg py-4">
                            {report.income.totalIncome.toFixed(3)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-b border-gray-300 hover:bg-gray-50">
                          <TableCell className="font-semibold text-black py-4">Total Expenses</TableCell>
                          <TableCell className="text-right font-bold text-red-700 text-lg py-4">
                            {report.expenses.total.toFixed(3)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-t-4 border-black bg-gray-100 hover:bg-gray-100">
                          <TableCell className="font-bold text-black text-lg py-5">NET PROFIT / LOSS</TableCell>
                          <TableCell className={`text-right font-bold text-2xl py-5 ${report.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                            {report.netProfit.toFixed(3)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div>
                  <h3 className="text-xl font-bold mb-4 pb-2 border-b-2 border-black text-black">Expense Breakdown by Category</h3>
                  {Object.entries(report.expenses.breakdown).length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <IconReceipt className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg">No expenses recorded for this month.</p>
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border-2 border-gray-300">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-100 border-b-2 border-black hover:bg-gray-100">
                            <TableHead className="text-black font-bold text-base py-4">Category</TableHead>
                            <TableHead className="text-right text-black font-bold text-base py-4">Amount (OMR)</TableHead>
                            <TableHead className="text-right text-black font-bold text-base py-4">% of Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(report.expenses.breakdown)
                            .sort(([,a], [,b]) => b - a)
                            .map(([category, amount]) => {
                              const percentage = report.expenses.total > 0 ? (amount / report.expenses.total) * 100 : 0;
                              return (
                                <TableRow key={category} className="border-b border-gray-300 hover:bg-gray-50">
                                  <TableCell className="font-medium text-black py-4">{category}</TableCell>
                                  <TableCell className="text-right font-semibold text-black text-base py-4">
                                    {amount.toFixed(3)}
                                  </TableCell>
                                  <TableCell className="text-right text-gray-600 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-800">
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t-2 border-gray-300 text-center">
                  <p className="text-xs text-gray-500">
                    Report generated on {format(new Date(), 'MMMM d, yyyy')} • Almakarem Kitchen Financial System
                  </p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}