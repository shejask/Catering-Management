'use client';

import { useState, useEffect, useRef } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { stockService, CateringItem, CateringTransaction } from '@/services/stockService';
import { Icons } from '@/components/icons';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';

type ReportType = 'DAILY_CONSUMPTION' | 'MONTHLY_CONSUMPTION' | 'STOCK_BALANCE' | 'CUSTOM';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('DAILY_CONSUMPTION');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [items, setItems] = useState<CateringItem[]>([]);
  const [stockSnapshot, setStockSnapshot] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<CateringTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportType === 'DAILY_CONSUMPTION') {
        setStartDate(new Date());
        setEndDate(new Date());
    } else if (reportType === 'MONTHLY_CONSUMPTION') {
        const now = new Date();
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
    }
  }, [reportType]);

  const handlePrint = async () => {
    const toastId = toast.loading("Generating PDF report...");

    try {
        const jsPDF = (await import('jspdf')).default;
        const autoTable = (await import('jspdf-autotable')).default;

        const doc = new jsPDF();

        // Add Header
        doc.setFontSize(18);
        doc.text("ALMAKAREM KITCHEN", 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text("Catering Management System", 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(reportType.replace('_', ' '), 105, 30, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Generated: ${format(new Date(), 'PPP p')}`, 105, 35, { align: 'center' });

        // Define columns and data based on report type
        let head: string[][] = [];
        let body: (string | number)[][] = [];

        if (reportType === 'STOCK_BALANCE') {
            head = [['Item Name', 'Category', 'Current Stock', 'Min Stock']];
            body = items.map(item => [
                item.name,
                item.category,
                `${stockSnapshot[item.id] || 0} ${item.unit}`,
                item.minStock
            ]);
        } else {
             head = [['Date', 'Item', 'Qty Used', 'Opening', 'Remaining']];
             body = transactions.map(t => [
                 t.date,
                 t.itemName,
                 `${t.quantity} ${t.unit}`,
                 t.openingStock || '-',
                 t.remainingStock || '-'
             ]);
        }

        autoTable(doc, {
            head: head,
            body: body,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [0, 0, 0] },
            styles: { fontSize: 9 },
        });

        doc.save(`Report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        toast.success("PDF downloaded successfully", { id: toastId });
    } catch (error) {
        console.error("PDF Generation failed", error);
        toast.error("Failed to generate PDF. Please try again.", { id: toastId });
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
        if (reportType === 'STOCK_BALANCE') {
            const [allItems, snapshot] = await Promise.all([
                stockService.getAllItems(),
                stockService.getStockSnapshot()
            ]);
            setItems(allItems);
            setStockSnapshot(snapshot);
        } else {
            const allTransactions = await stockService.getTransactions();
            const now = new Date();
            let filtered = allTransactions.filter(t => t.type === 'OUT');
            
            if (reportType === 'DAILY_CONSUMPTION') {
                const today = format(now, 'yyyy-MM-dd');
                filtered = filtered.filter(t => t.date === today);
            } else if (reportType === 'MONTHLY_CONSUMPTION') {
                const thisMonth = format(now, 'yyyy-MM');
                filtered = filtered.filter(t => t.date.startsWith(thisMonth));
            } else if (reportType === 'CUSTOM' && startDate && endDate) {
                filtered = filtered.filter(t => {
                    const tDate = parseISO(t.date);
                    return isWithinInterval(tDate, {
                        start: startOfDay(startDate),
                        end: endOfDay(endDate)
                    });
                });
            }
            setTransactions(filtered);
        }
    } catch (error) {
        console.error(error);
        toast.error("Failed to load report data");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, startDate, endDate]);

  const exportToCSV = () => {
     let headers: string[] = [];
     let rows: (string | number)[][] = [];

     if (reportType === 'STOCK_BALANCE') {
         headers = ['Item Name', 'Arabic Name', 'Category', 'Unit', 'Current Stock', 'Min Stock'];
         rows = items.map(item => [
             item.name,
             item.nameAr || '',
             item.category,
             item.unit,
             stockSnapshot[item.id] || 0,
             item.minStock
         ]);
     } else {
         headers = ['Date', 'Item', 'Quantity', 'Unit', 'Opening Stock', 'Remaining Stock'];
         rows = transactions.map(t => [
             t.date,
             t.itemName,
             t.quantity,
             t.unit,
             t.openingStock || '-',
             t.remainingStock || '-'
         ]);
     }

     const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `${reportType}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <PageContainer>
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-center justify-between">
            <Heading title="Reports" description="Generate printable daily & monthly reports" />
            <div className="flex gap-2">
                <Button variant="outline" onClick={exportToCSV}>
                    <Icons.file className="mr-2 h-4 w-4" /> Export CSV
                </Button>
                <Button onClick={handlePrint}>
                    <Icons.post className="mr-2 h-4 w-4" /> Print PDF
                </Button>
            </div>
        </div>
        <Separator />
        
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <Select value={reportType} onValueChange={(value: string) => setReportType(value as ReportType)}>
                <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select Report Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="DAILY_CONSUMPTION">Daily Report (Today)</SelectItem>
                    <SelectItem value="MONTHLY_CONSUMPTION">Monthly Report (This Month)</SelectItem>
                    <SelectItem value="CUSTOM">Consumption Report (Custom Range)</SelectItem>
                    <SelectItem value="STOCK_BALANCE">Current Stock Balance</SelectItem>
                </SelectContent>
            </Select>

            {reportType === 'CUSTOM' && (
                <div className="flex items-center space-x-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[180px] justify-start text-left font-normal",
                                    !startDate && "text-muted-foreground"
                                )}
                            >
                                <Icons.calendar className="mr-2 h-4 w-4" />
                                {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={setStartDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                    <span className="text-sm text-gray-500">to</span>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-[180px] justify-start text-left font-normal",
                                    !endDate && "text-muted-foreground"
                                )}
                            >
                                <Icons.calendar className="mr-2 h-4 w-4" />
                                {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={setEndDate}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            {reportType === 'STOCK_BALANCE' && (
                <div className="text-sm text-gray-500 italic">
                    Displaying current available stock quantities.
                </div>
            )}

            <Button variant="secondary" onClick={loadReportData}>
                <Icons.refresh className="mr-2 h-4 w-4" /> Refresh
            </Button>
        </div>

        <div 
            className="mt-4 border border-[#e5e7eb] rounded-md bg-[#ffffff] p-8 min-h-[500px] text-[#000000]" 
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
             <div className="mb-8 text-center">
                <h1 className="text-2xl font-bold uppercase tracking-wide text-[#000000]">Almakarem Kitchen</h1>
                <p className="text-[#6b7280] text-sm">Catering Management System</p>
                <h2 className="text-xl font-semibold mt-4 border-b border-[#d1d5db] pb-2 inline-block text-[#000000]">
                    {reportType.replace('_', ' ')}
                </h2>
                <p className="text-sm text-[#6b7280] mt-1">Generated: {format(new Date(), 'PPP p')}</p>
             </div>

             {loading ? (
                 <div className="text-center py-10 text-[#6b7280]">Loading report data...</div>
             ) : (
                 <div className="w-full">
                    {reportType === 'STOCK_BALANCE' ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#1f2937]">
                                    <th className="h-10 px-2 text-left align-middle font-bold text-[#374151]">Item Name</th>
                                    <th className="h-10 px-2 text-left align-middle font-bold text-[#374151]">Category</th>
                                    <th className="h-10 px-2 text-right align-middle font-bold text-[#374151]">Current Stock</th>
                                    <th className="h-10 px-2 text-right align-middle font-bold text-[#374151]">Min Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="border-b border-[#f3f4f6]">
                                        <td className="p-2 align-middle">
                                            <div className="font-medium text-[#000000]">{item.name}</div>
                                            <div className="text-xs text-[#6b7280]">{item.nameAr}</div>
                                        </td>
                                        <td className="p-2 align-middle text-[#000000]">{item.category}</td>
                                        <td className="p-2 align-middle text-right font-bold text-[#000000]">
                                            {stockSnapshot[item.id] || 0} <span className="text-xs font-normal text-[#6b7280]">{item.unit}</span>
                                        </td>
                                        <td className="p-2 align-middle text-right text-[#000000]">
                                            {item.minStock}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[#1f2937]">
                                    <th className="h-10 px-2 text-left align-middle font-bold text-[#374151]">Date</th>
                                    <th className="h-10 px-2 text-left align-middle font-bold text-[#374151]">Item</th>
                                    <th className="h-10 px-2 text-right align-middle font-bold text-[#374151]">Quantity Used</th>
                                    <th className="h-10 px-2 text-right align-middle font-bold text-[#374151]">Opening</th>
                                    <th className="h-10 px-2 text-right align-middle font-bold text-[#374151]">Remaining</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-[#6b7280]">
                                            No consumption records found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map(t => (
                                        <tr key={t.id} className="border-b border-[#f3f4f6]">
                                            <td className="p-2 align-middle text-[#000000]">{t.date}</td>
                                            <td className="p-2 align-middle text-[#000000]">{t.itemName}</td>
                                            <td className="p-2 align-middle text-right font-medium text-[#000000]">
                                                {t.quantity} {t.unit}
                                            </td>
                                            <td className="p-2 align-middle text-right text-[#6b7280]">
                                                {t.openingStock}
                                            </td>
                                            <td className="p-2 align-middle text-right font-bold text-[#000000]">
                                                {t.remainingStock}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                 </div>
             )}
        </div>
      </div>
    </PageContainer>
  );
}