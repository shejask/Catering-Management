// app/api/generate-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface OrderWithStatus {
  receiptNo?: string;
  orderId?: string;
  name?: string;
  orderDetails?: string;
  phoneNumber?: string;
  deliveryType?: 'Delivery' | 'Pickup' | string;
  date?: string;
  time?: string;
  status?: 'completed' | 'pending' | 'cancelled' | string;
  totalPayment?: string;
  totalAmount?: number;
  advancePayment?: string;
  balancePayment?: string;
  discount?: string;
  location?: string;
  paymentType?: 'cash' | 'atm' | 'transfer' | string;
  cookStatus?: 'pending' | 'preparing' | 'ready' | 'delivered' | string;
  address?: string;
  timeAgo?: string;
}

interface PDFGenerationRequest {
  orders: OrderWithStatus[];
  language: 'ar' | 'en';
  showSummary?: boolean;
  title?: string;
  autoPrint?: boolean; // New parameter to control auto-print
}

// Arabic translations
const getArabicTranslations = (): Record<string, string> => ({
  todayOrders: 'طلبات اليوم',
  generatedOn: 'تاريخ الإنشاء',
  noOrders: 'لا توجد طلبات للعرض',
  receiptNo: 'رقم الإيصال',
  customer: 'العميل',
  orderDetails: 'تفاصيل الطلب',
  phoneNumber: 'رقم الهاتف',
  deliveryType: 'نوع التوصيل',
  date: 'التاريخ',
  time: 'الوقت',
  status: 'الحالة',
  totalAmount: 'المبلغ الإجمالي',
  delivery: 'توصيل',
  pickup: 'استلام',
  completed: 'مكتمل',
  pending: 'في الانتظار',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
  cash: 'نقدي',
  atm: 'بطاقة',
  transfer: 'تحويل',
  page: 'صفحة',
  of: 'من',
  orderSummary: 'ملخص الطلبات',
  totalOrders: 'إجمالي الطلبات',
  statusBreakdown: 'توزيع الحالات',
  na: 'غير محدد',
  paymentType: 'نوع الدفع'
});

// English translations
const getEnglishTranslations = (): Record<string, string> => ({
  todayOrders: "Today's Orders",
  generatedOn: 'Generated On',
  noOrders: 'No Orders to Display',
  receiptNo: 'Receipt No',
  customer: 'Customer',
  orderDetails: 'Order Details',
  phoneNumber: 'Phone Number',
  deliveryType: 'Delivery Type',
  date: 'Date',
  time: 'Time',
  status: 'Status',
  totalAmount: 'Total Amount',
  delivery: 'Delivery',
  pickup: 'Pickup',
  completed: 'Completed',
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  cash: 'Cash',
  atm: 'Card',
  transfer: 'Transfer',
  page: 'Page',
  of: 'of',
  orderSummary: 'Order Summary',
  totalOrders: 'Total Orders',
  statusBreakdown: 'Status Breakdown',
  na: 'N/A',
  paymentType: 'Payment Type'
});

// Generate HTML content with proper Arabic support and auto-print functionality
const generateHTMLContent = (options: PDFGenerationRequest): string => {
  const { orders, language, showSummary = false, autoPrint = false } = options;
  const isArabic = language === 'ar';
  const translations = isArabic
    ? getArabicTranslations()
    : getEnglishTranslations();

  const now = new Date();
  const dateTimeStr = isArabic
    ? new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(now)
    : now.toLocaleDateString('en-US') + ' ' + now.toLocaleTimeString('en-US');

  // Calculate summary data
  const totalOrders = orders.length;
  const totalAmount = orders.reduce(
    (sum, order) => sum + (parseFloat(order.totalPayment || '0') || 0),
    0
  );

  // Status breakdown
  const statusCounts = orders.reduce(
    (acc, order) => {
      const status = order.cookStatus || 'pending';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const formatCurrency = (amount: number): string => {
    if (isArabic) {
      return `${amount.toFixed(3)} ر.ع.`;
    }
    return `OMR ${amount.toFixed(3)}`;
  };

  const translateStatus = (status: string): string => {
    if (!isArabic) return status;
    const statusMap: Record<string, string> = {
      pending: 'في الانتظار',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      completed: 'مكتمل',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
      pickup: 'استلام',
      delivery: 'توصيل'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  // Auto-print script
  const autoPrintScript = autoPrint
    ? `
    <script>
      // Wait for page to fully load including fonts and images
      window.addEventListener('load', function() {
        // Additional delay to ensure everything is rendered
        setTimeout(function() {
          // Check if we're in a browser environment (not headless)
          if (typeof window !== 'undefined' && window.print) {
            try {
              // Trigger the browser's print dialog
              window.print();
            } catch (error) {
              console.warn('Auto-print failed:', error);
              
              // Fallback: Add a visible print button if auto-print fails
              const printButton = document.createElement('button');
              printButton.innerHTML = '${isArabic ? 'طباعة / حفظ كـ PDF' : 'Print / Save as PDF'}';
              printButton.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                background: #2563eb;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
              \`;
              
              printButton.onmouseover = function() {
                this.style.background = '#1d4ed8';
                this.style.transform = 'translateY(-2px)';
              };
              
              printButton.onmouseout = function() {
                this.style.background = '#2563eb';
                this.style.transform = 'translateY(0)';
              };
              
              printButton.onclick = function() {
                window.print();
              };
              
              document.body.appendChild(printButton);
            }
          }
        }, 1500); // 1.5 second delay to ensure everything is loaded
      });

      // Also trigger on fonts ready (backup)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function() {
          setTimeout(function() {
            if (typeof window !== 'undefined' && window.print && !document.querySelector('button')) {
              try {
                window.print();
              } catch (error) {
                console.warn('Backup auto-print failed:', error);
              }
            }
          }, 1000);
        });
      }
    </script>
  `
    : '';

  return `
    <!DOCTYPE html>
    <html ${isArabic ? 'dir="rtl" lang="ar"' : 'dir="ltr" lang="en"'}>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${translations.todayOrders}</title>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: ${
            isArabic
              ? "'Noto Sans Arabic', 'Amiri', 'Arial Unicode MS', sans-serif"
              : "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif"
          };
          direction: ${isArabic ? 'rtl' : 'ltr'};
          background: #ffffff;
          color: #1e293b;
          font-size: 12px;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          min-height: 100vh;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #e2e8f0;
        }
        
        .title {
          font-size: 28px;
          color: #2563eb;
          margin-bottom: 10px;
          font-weight: bold;
          ${isArabic ? 'font-family: "Noto Sans Arabic", "Amiri", serif;' : ''}
        }
        
        .subtitle {
          color: #64748b;
          font-size: 14px;
          font-weight: 400;
        }
        
        .orders-section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #374151;
          margin-bottom: 15px;
          ${isArabic ? 'text-align: right;' : 'text-align: left;'}
        }
        
        .orders-grid {
          display: grid;
          gap: 15px;
        }
        
        .order-card {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          background: #f9fafb;
          transition: all 0.2s ease;
        }
        
        .order-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }
        
        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .receipt-no {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
          background: #dbeafe;
          padding: 4px 12px;
          border-radius: 6px;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-preparing { background: #fde68a; color: #92400e; }
        .status-ready { background: #bbf7d0; color: #166534; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-delivered { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #fecaca; color: #991b1b; }
        
        .order-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .detail-value {
          font-size: 13px;
          color: #1f2937;
          font-weight: 500;
        }
        
        .amount {
          font-size: 16px;
          font-weight: bold;
          color: #059669;
        }
        
        .summary-section {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 25px;
          margin-top: 40px;
        }
        
        .summary-title {
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 20px;
          ${isArabic ? 'text-align: right;' : 'text-align: left;'}
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .summary-item {
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .summary-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 5px;
        }
        
        .summary-value {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .status-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 10px;
          margin-top: 15px;
        }
        
        .status-item {
          background: white;
          padding: 10px;
          border-radius: 6px;
          text-align: center;
          border: 1px solid #e5e7eb;
        }
        
        .status-count {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .status-label {
          font-size: 11px;
          color: #6b7280;
          margin-top: 2px;
        }
        
        .no-orders {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
          font-size: 16px;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #9ca3af;
          font-size: 11px;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        
        /* Print optimizations */
        @media print {
          body { 
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact;
          }
          .order-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          
          /* Hide any print buttons when actually printing */
          button {
            display: none !important;
          }
        }
        
        /* Arabic text enhancements */
        ${
          isArabic
            ? `
          .title, .section-title, .summary-title {
            font-family: "Noto Sans Arabic", "Amiri", serif;
            font-weight: 700;
          }
          
          .detail-value, .summary-value {
            font-family: "Noto Sans Arabic", "Amiri", sans-serif;
          }
          
          .receipt-no {
            font-family: "Courier New", monospace;
          }
        `
            : ''
        }
      </style>
      ${autoPrintScript}
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1 class="title">${translations.todayOrders}</h1>
          <div class="subtitle">${translations.generatedOn}: ${dateTimeStr}</div>
        </div>
        
        <!-- Orders Section -->
        <div class="orders-section">
          ${
            orders.length === 0
              ? `
            <div class="no-orders">
              <p>${translations.noOrders}</p>
            </div>
          `
              : `
            <div class="orders-grid">
              ${orders
                .map(
                  (order) => `
                <div class="order-card">
                  <div class="order-header">
                    <div class="receipt-no">
                      ${translations.receiptNo}: ${order.receiptNo || order.orderId || translations.na}
                    </div>
                    <div class="status-badge status-${(order.cookStatus || 'pending').toLowerCase()}">
                      ${translateStatus(order.cookStatus || 'pending')}
                    </div>
                  </div>
                  
                  <div class="order-details">
                    <div class="detail-item">
                      <div class="detail-label">${translations.customer}</div>
                      <div class="detail-value">${order.name || translations.na}</div>
                    </div>
                    
                    <div class="detail-item">
                      <div class="detail-label">${translations.phoneNumber}</div>
                      <div class="detail-value">${order.phoneNumber || translations.na}</div>
                    </div>
                    
                    <div class="detail-item">
                      <div class="detail-label">${translations.deliveryType}</div>
                      <div class="detail-value">${translateStatus(order.deliveryType || 'na')}</div>
                    </div>
                    
                    <div class="detail-item">
                      <div class="detail-label">${translations.date}</div>
                      <div class="detail-value">${order.date || translations.na}</div>
                    </div>
                    
                    <div class="detail-item">
                      <div class="detail-label">${translations.time}</div>
                      <div class="detail-value">${order.time || translations.na}</div>
                    </div>
                  </div>
                  
                  ${
                    order.orderDetails
                      ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                      <div class="detail-label">${translations.orderDetails}</div>
                      <div class="detail-value" style="margin-top: 5px;">${order.orderDetails}</div>
                    </div>
                  `
                      : ''
                  }
                </div>
              `
                )
                .join('')}
            </div>
          `
          }
        </div>
        
        <!-- Summary Section -->
        ${
          showSummary && orders.length > 0
            ? `
          <div class="summary-section">
            <h2 class="summary-title">${translations.orderSummary}</h2>
            
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">${translations.totalOrders}</div>
                <div class="summary-value">${totalOrders}</div>
              </div>
            </div>
          </div>
        `
            : ''
        }
      </div>
    </body>
    </html>
  `;
};

export async function POST(req: NextRequest) {
  let orders: OrderWithStatus[] = [];
  let language: 'ar' | 'en' = 'ar';
  let showSummary: boolean = false;

  try {
    console.log('=== STARTING PDF GENERATION ===');

    const requestData: PDFGenerationRequest = await req.json();
    orders = requestData.orders || [];
    language = requestData.language || 'ar';
    showSummary = requestData.showSummary || false;

    if (!orders || !Array.isArray(orders)) {
      console.error('Invalid orders data received');
      return NextResponse.json(
        { error: 'Invalid orders data' },
        { status: 400 }
      );
    }

    console.log(`Generating PDF for ${orders.length} orders in ${language}`);
    console.log('Orders sample:', orders.slice(0, 2));

    // Launch Puppeteer with better error handling
    console.log('Launching Puppeteer browser...');
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true, // Use true for compatibility
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--disable-gpu'
        ]
      });
      console.log('Browser launched successfully');
    } catch (browserError) {
      console.error('Failed to launch browser:', browserError);
      throw new Error(`Browser launch failed: ${browserError}`);
    }

    let page;
    try {
      console.log('Creating new page...');
      page = await browser.newPage();

      // Set viewport for consistent rendering
      console.log('Setting viewport...');
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2
      });

      // Generate HTML content with auto-print enabled for fallback
      console.log('Generating HTML content...');
      const htmlContent = generateHTMLContent({
        orders,
        language,
        showSummary,
        autoPrint: true // Enable auto-print for fallback HTML
      });
      console.log('HTML content length:', htmlContent.length);

      // Set the content
      console.log('Setting page content...');
      await page.setContent(htmlContent, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      // Wait for fonts to load
      console.log('Waiting for fonts to load...');
      try {
        await page.evaluateHandle('document.fonts.ready');
        await page.waitForFunction(
          () => {
            return document.fonts.status === 'loaded';
          },
          { timeout: 10000 }
        );

        // Additional wait using evaluate
        await page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
        console.log('Fonts loaded successfully');
      } catch (fontError) {
        console.warn('Font loading warning:', fontError);
        // Continue anyway
      }

      // Generate PDF
      console.log('Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        preferCSSPageSize: true
      });

      console.log('PDF generated, size:', pdfBuffer.length, 'bytes');
      console.log('PDF generated successfully');

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.length.toString(),
          'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });
    } catch (pageError) {
      console.error('Error during page operations:', pageError);
      throw new Error(`Page operation failed: ${pageError}`);
    } finally {
      // Always close the browser
      if (browser) {
        try {
          await browser.close();
          console.log('Browser closed in finally block');
        } catch (closeError) {
          console.error('Error closing browser:', closeError);
        }
      }
    }
  } catch (error) {
    console.error('Error generating PDF:', error);

    // Try to provide a fallback HTML response with auto-print
    try {
      console.log('Attempting fallback HTML response with auto-print...');
      const fallbackHTML = generateHTMLContent({
        orders: orders || [],
        language: language || 'ar',
        showSummary: showSummary || false,
        autoPrint: true // Enable auto-print for fallback
      });

      return new NextResponse(fallbackHTML, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="orders-fallback-${new Date().toISOString().split('T')[0]}.html"`
        }
      });
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      return NextResponse.json(
        {
          error: 'Failed to generate PDF',
          details: error instanceof Error ? error.message : 'Unknown error',
          fallbackError:
            fallbackError instanceof Error
              ? fallbackError.message
              : 'Unknown fallback error'
        },
        { status: 500 }
      );
    }
  }
}
