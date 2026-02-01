import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

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

interface ReceiptGenerationRequest {
  order: OrderWithStatus;
  language: 'ar' | 'en';
  logoUrl?: string;
  useDefaultLogo?: boolean;
  autoPrint?: boolean;
}

// Function to load default logo as base64
const getDefaultLogoBase64 = (): string => {
  try {
    // Try to read the default logo file
    const logoPath = path.join(
      process.cwd(),
      'public',
      'assets',
      'images',
      'invoice-header.png'
    );
    if (fs.existsSync(logoPath)) {
      const imageBuffer = fs.readFileSync(logoPath);
      const base64Image = imageBuffer.toString('base64');
      return `data:image/png;base64,${base64Image}`;
    }
  } catch (error) {
    console.warn('Could not load default logo:', error);
  }
  return '';
};

// Arabic translations for receipts
const getArabicTranslations = (): Record<string, string> => ({
  receipt: 'إيصال',
  receiptNo: 'رقم الإيصال',
  customer: 'العميل',
  orderDetails: 'تفاصيل الطلب',
  phoneNumber: 'رقم الهاتف',
  deliveryType: 'نوع التوصيل',
  date: 'التاريخ',
  time: 'الوقت',
  status: 'الحالة',
  totalAmount: 'المبلغ الإجمالي',
  advancePayment: 'الدفعة المقدمة',
  balancePayment: 'المبلغ المتبقي',
  discount: 'الخصم',
  paymentType: 'نوع الدفع',
  address: 'العنوان',
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
  thankYou: 'شكراً لك على طلبك!',
  generatedOn: 'تم الإنشاء في',
  na: 'غير محدد'
});

// English translations for receipts
const getEnglishTranslations = (): Record<string, string> => ({
  receipt: 'Receipt',
  receiptNo: 'Receipt No',
  customer: 'Customer',
  orderDetails: 'Order Details',
  phoneNumber: 'Phone Number',
  deliveryType: 'Delivery Type',
  date: 'Date',
  time: 'Time',
  status: 'Status',
  totalAmount: 'Total Amount',
  advancePayment: 'Advance Payment',
  balancePayment: 'Balance Payment',
  discount: 'Discount',
  paymentType: 'Payment Type',
  address: 'Address',
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
  thankYou: 'Thank you for your order!',
  generatedOn: 'Generated On',
  na: 'N/A'
});

// Generate HTML content for receipt
const generateReceiptHTML = (options: ReceiptGenerationRequest): string => {
  const {
    order,
    language,
    logoUrl,
    useDefaultLogo = true,
    autoPrint = false
  } = options;
  const isArabic = language === 'ar';
  const translations = isArabic
    ? getArabicTranslations()
    : getEnglishTranslations();

  // Get the logo to use
  let finalLogoUrl = logoUrl;
  if (!finalLogoUrl && useDefaultLogo) {
    finalLogoUrl = getDefaultLogoBase64();
    console.log('Default logo loaded:', finalLogoUrl ? 'Yes' : 'No');
  }
  console.log('Final logo URL:', finalLogoUrl ? 'Available' : 'Not available');

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

  const translatePaymentType = (paymentType: string): string => {
    if (!isArabic) return paymentType;
    const paymentMap: Record<string, string> = {
      cash: 'نقدي',
      atm: 'بطاقة',
      card: 'بطاقة',
      transfer: 'تحويل'
    };
    return paymentMap[paymentType.toLowerCase()] || paymentType;
  };

  // Auto-print script (this was the missing piece!)
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
      <title>${translations.receipt}</title>
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
        
        .receipt-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: white;
          color: #1e293b;
          padding: 30px 20px;
          text-align: center;
          position: relative;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .logo-placeholder {
          width: 120px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border: 2px dashed rgba(255, 255, 255, 0.5);
          border-radius: 8px;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          ${finalLogoUrl ? 'background-image: url(' + finalLogoUrl + '); background-size: contain; background-repeat: no-repeat; background-position: center; border: none;' : ''}
        }
        
        .receipt-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
          ${isArabic ? 'font-family: "Noto Sans Arabic", "Amiri", serif;' : ''}
        }
        
        .receipt-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .receipt-number {
          background: #2563eb;
          color: white;
          padding: 12px 24px;
          border-radius: 25px;
          font-size: 18px;
          font-weight: bold;
          margin-top: 20px;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          text-align: center;
          min-width: 200px;
          max-width: 400px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .content {
          padding: 30px 20px;
        }
        
        .section {
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
          ${isArabic ? 'text-align: right;' : 'text-align: left;'}
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }
        
        .info-item {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .info-label {
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 5px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .info-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }
        
        .amount {
          font-size: 18px;
          font-weight: bold;
          color: #059669;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          display: inline-block;
        }
        
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-preparing { background: #fde68a; color: #92400e; }
        .status-ready { background: #bbf7d0; color: #166534; }
        .status-completed { background: #d1fae5; color: #065f46; }
        .status-delivered { background: #dcfce7; color: #166534; }
        .status-cancelled { background: #fecaca; color: #991b1b; }
        
        .order-details-box {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-top: 15px;
        }
        
        .order-details-text {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }
        
        .footer {
          background: #f8fafc;
          padding: 20px;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }
        
        .thank-you {
          font-size: 16px;
          color: #2563eb;
          font-weight: bold;
          margin-bottom: 10px;
          ${isArabic ? 'font-family: "Noto Sans Arabic", "Amiri", serif;' : ''}
        }
        
        .generated-info {
          font-size: 11px;
          color: #6b7280;
        }
        
        /* Print optimizations */
        @media print {
          body { 
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact;
          }
          .receipt-container {
            border: none;
            box-shadow: none;
          }
          
          /* Hide any print buttons when actually printing */
          button {
            display: none !important;
          }
          
          /* Ensure receipt number is visible in print */
          .receipt-number {
            background: #2563eb !important;
            color: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        /* Responsive design for receipt number */
        @media (max-width: 600px) {
          .receipt-number {
            font-size: 16px;
            padding: 10px 20px;
            min-width: 180px;
            max-width: 300px;
          }
        }
        
        @media (max-width: 400px) {
          .receipt-number {
            font-size: 14px;
            padding: 8px 16px;
            min-width: 150px;
            max-width: 250px;
          }
        }
        
        /* Arabic text enhancements */
        ${
          isArabic
            ? `
          .receipt-title, .section-title, .thank-you {
            font-family: "Noto Sans Arabic", "Amiri", serif;
            font-weight: 700;
          }
          
          .info-value, .order-details-text {
            font-family: "Noto Sans Arabic", "Amiri", sans-serif;
          }
          
          .receipt-number {
            font-family: "Courier New", monospace;
          }
        `
            : ''
        }
      </style>
      ${autoPrintScript}
    </head>
    <body>
      <div class="receipt-container">
        <!-- Header with Logo Placeholder -->
        <div class="header">
          ${
            finalLogoUrl
              ? `<img src="${finalLogoUrl}" alt="Company Logo" style="width: 100%; height: 100%; object-fit: contain; margin: 0 auto 20px; display: block;" />`
              : `<div class="logo-placeholder">
              ${isArabic ? 'شعار الشركة' : 'Company Logo'}
            </div>`
          }
          
          <!-- Receipt Number Display -->
          <div class="receipt-number" title="${order.receiptNo || order.orderId || 'N/A'}">
            ${translations.receiptNo}: ${(order.receiptNo || order.orderId || 'N/A').length > 25 ? 
              (order.receiptNo || order.orderId || 'N/A').substring(0, 25) + '...' : 
              (order.receiptNo || order.orderId || 'N/A')}
          </div>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Customer Information -->
          <div class="section">

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">${translations.customer}</div>
                <div class="info-value">${order.name || translations.na}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">${translations.phoneNumber}</div>
                <div class="info-value">${order.phoneNumber || translations.na}</div>
              </div>
              
              ${
                order.address
                  ? `
                <div class="info-item">
                  <div class="info-label">${translations.address}</div>
                  <div class="info-value">${order.address}</div>
                </div>
              `
                  : ''
              }
            </div>
          </div>
          
          <!-- Order Information -->
          <div class="section">

            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">${translations.date}</div>
                <div class="info-value">${order.date || translations.na}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">${translations.time}</div>
                <div class="info-value">${order.time || translations.na}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">${translations.deliveryType}</div>
                <div class="info-value">${translateStatus(order.deliveryType || 'na')}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">${translations.status}</div>
                <div class="status-badge status-${(order.cookStatus || 'pending').toLowerCase()}">
                  ${translateStatus(order.cookStatus || 'pending')}
                </div>
              </div>
            </div>
            
            ${
              order.orderDetails
                ? `
              <div class="order-details-box">
                <div class="info-label">${translations.orderDetails}</div>
                <div class="order-details-text">${order.orderDetails}</div>
              </div>
            `
                : ''
            }

             <div class="section">
            <h2 class="section-title"></h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">${translations.totalAmount}</div>
                <div class="info-value amount">${formatCurrency(parseFloat(order.totalPayment || '0'))}</div>
              </div>
              
              ${
                order.advancePayment
                  ? `
                <div class="info-item">
                  <div class="info-label">${translations.advancePayment}</div>
                  <div class="info-value">${formatCurrency(parseFloat(order.advancePayment))}</div>
                </div>
              `
                  : ''
              }
              
              ${
                order.balancePayment
                  ? `
                <div class="info-item">
                  <div class="info-label">${translations.balancePayment}</div>
                  <div class="info-value">${formatCurrency(parseFloat(order.balancePayment))}</div>
                </div>
              `
                  : ''
              }
              
          
              
              ${
                order.paymentType
                  ? `
                <div class="info-item">
                  <div class="info-label">${translations.paymentType}</div>
                  <div class="info-value">${translatePaymentType(order.paymentType)}</div>
                </div>
              `
                  : ''
              }
            </div>
          </div>
          </div>
          
          <!-- Payment Information -->
         
        </div>
        
        <!-- Footer -->
       
      </div>
    </body>
    </html>
  `;
};

export async function POST(req: NextRequest) {
  let order: OrderWithStatus | null = null;
  let language: 'ar' | 'en' = 'ar';
  let logoUrl: string | undefined;
  let useDefaultLogo: boolean = true;

  try {
    console.log('=== STARTING RECEIPT GENERATION ===');

    const requestData: ReceiptGenerationRequest = await req.json();
    order = requestData.order || null;
    language = requestData.language || 'ar';
    logoUrl = requestData.logoUrl;
    useDefaultLogo = requestData.useDefaultLogo !== false; // Default to true

    if (!order) {
      console.error('Invalid order data received');
      return NextResponse.json(
        { error: 'Invalid order data' },
        { status: 400 }
      );
    }

    console.log(
      `Generating receipt for order: ${order.receiptNo || order.orderId}`
    );
    console.log('Language:', language);
    console.log('Logo URL:', logoUrl);

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
        width: 800,
        height: 600,
        deviceScaleFactor: 2
      });

      // Generate HTML content
      console.log('Generating receipt HTML content...');
      const htmlContent = generateReceiptHTML({
        order,
        language,
        logoUrl,
        useDefaultLogo,
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
      console.log('Generating receipt PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15px',
          right: '15px',
          bottom: '15px',
          left: '15px'
        },
        preferCSSPageSize: true
      });

      console.log('Receipt PDF generated, size:', pdfBuffer.length, 'bytes');
      console.log('Receipt PDF generated successfully');

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': pdfBuffer.length.toString(),
          'Content-Disposition': `attachment; filename="receipt-${order.receiptNo || order.orderId || 'unknown'}-${new Date().toISOString().split('T')[0]}.pdf"`
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
    console.error('Error generating receipt PDF:', error);

    // Try to provide a fallback HTML response
    try {
      console.log('Attempting fallback HTML response...');
      if (order) {
        const fallbackHTML = generateReceiptHTML({
          order,
          language: language || 'ar',
          logoUrl,
          useDefaultLogo,
          autoPrint: true // Enable auto-print for fallback
        });

        return new NextResponse(fallbackHTML, {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `inline; filename="receipt-fallback-${order.receiptNo || order.orderId || 'unknown'}-${new Date().toISOString().split('T')[0]}.html"`
          }
        });
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
    }

    return NextResponse.json(
      {
        error: 'Failed to generate receipt PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
