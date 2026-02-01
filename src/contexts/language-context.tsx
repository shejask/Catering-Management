'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations = {
  en: {
    // Header
    'language.english': 'English',
    'language.arabic': 'Arabic',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.createOrder': 'Create Order',
    'nav.allOrders': 'All Orders',
    'nav.kitchen': 'Kitchen',
    'nav.kitchenOrders': 'Kitchen Orders',
    
    // Dashboard
    'dashboard.welcome': 'Hi, Welcome back 👋',
    'dashboard.totalRevenue': 'Total Revenue',
    'dashboard.totalCustomers': 'Total Customers',
    'dashboard.balanceToPayCustomer': 'Balance to Pay Customer',
    'dashboard.pendingKitchen': 'Pending Kitchen',
    'dashboard.recentOrders': 'Recent Orders',
    'dashboard.quickStats': 'Quick Stats',
    'dashboard.todayOverview': 'Today\'s overview',
    'dashboard.revenueStatus': 'Revenue Status',
    'dashboard.kitchenStatus': 'Kitchen Status',
    'dashboard.pendingBalance': 'Pending Balance',
    'dashboard.totalCustomersCount': 'Total Customers',
    'dashboard.latestOrders': 'Latest 5 orders from your restaurant',
    'dashboard.noOrdersFound': 'No orders found',
    'dashboard.loadingFromFirebase': 'Loading data from Firebase...',
    'dashboard.firebaseLive': 'Firebase Live',
    'dashboard.paidOrders': 'Paid Orders',
    'dashboard.unique': 'Unique',
    'dashboard.pending': 'Pending',
    'dashboard.kitchen': 'Kitchen',
    'dashboard.revenueFromPaidOrders': 'Revenue from paid orders',
    'dashboard.sumOfTotalPaymentDiscount': 'Sum of (totalPayment - discount) for paid orders',
    'dashboard.uniqueCustomers': 'Unique customers',
    'dashboard.basedOnUniquePhoneNumbers': 'Based on unique phone numbers',
    'dashboard.outstandingBalance': 'Outstanding balance',
    'dashboard.amountPendingFromUnpaidOrders': 'Amount pending from unpaid orders',
    'dashboard.ordersInKitchen': 'Orders in kitchen',
    'dashboard.ordersWithStatusPendingOrPreparing': 'Orders with status \'pending\' or \'preparing\'',
    'dashboard.active': 'Active',
    'dashboard.noRevenue': 'No Revenue',
    'dashboard.clear': 'Clear',
    'dashboard.allClear': 'All Clear',
    'dashboard.todayOrders': 'Today Orders',
    'dashboard.kitchenOrders': 'Kitchen Orders',
    'dashboard.completedOrders': 'Completed Orders',
    'dashboard.upcomingOrders': 'Upcoming Orders',
    'dashboard.ordersForToday': 'Orders for today',
    'dashboard.currentlyInKitchen': 'Currently in kitchen',
    'dashboard.deliveredToday': 'Delivered today',
    'dashboard.ordersForUpcoming': 'Upcoming orders',
    'dashboard.ordersScheduledForToday': 'Orders scheduled for today',
    'dashboard.ordersScheduledForUpcoming': 'Orders scheduled for upcoming dates',
    'button.downloadPDF': 'Download PDF',
    'message.noOrdersForUpcoming': 'No upcoming orders found',
    
    // Create Order Page
    'page.createOrder': 'Create Order',
    'page.createOrderDescription': 'Fill in the details to create a new order',
    'page.editOrder': 'Edit Order',
    'page.editOrderDescription': 'Edit the order details below',
    'section.orderInformation': 'Order Information',
    'section.customerInformation': 'Customer Information',
    'section.orderDetails': 'Order Details',
    'section.paymentInformation': 'Payment Information',
    
    // All Orders Page
    'page.allOrders': 'All Orders',
    'page.receptionistDashboard': 'Receptionist Dashboard',
    'section.ordersManagement': 'Orders Management',
    'section.filters': 'Filters',
    'filter.paymentStatus': 'Payment Status',
    'filter.kitchenStatus': 'Kitchen Status',
    'filter.allStatus': 'All Status',
    'filter.clearFilters': 'Clear Filters',
    'filter.showingResults': 'Showing {count} of {total} orders',
    'filter.searchPlaceholder': 'Search orders by name, receipt number, or phone...',
    'filter.dateRange': 'Date Range',
    'filter.allDates': 'All Dates',
    'filter.today': 'Today',
    'filter.thisWeek': 'This Week',
    'filter.thisMonth': 'This Month',
    'filter.clearDates': 'Clear Dates',
    
    // Kitchen Page
    'page.kitchen': 'Kitchen',
    'page.kitchenOrders': 'Kitchen Orders',
    'cook.activeOrders': 'Active Orders',
    'cook.noOrders': 'No Orders in Kitchen',
    'cook.noOrdersDescription': 'Orders shared with the kitchen will appear here.',
    'cook.orderDetails': 'Order Details:',
    'cook.cookStatus': 'Cook Status:',
    'cook.markCompleted': 'Mark Completed',
    
    // Form Fields
    'field.customerName': 'Customer Name',
    'field.customerName.placeholder': 'Enter customer name',
    'field.phoneNumber': 'Phone Number',
    'field.phoneNumber.placeholder': 'Enter phone number',
    'field.deliveryLocation': 'Delivery Location',
    'field.deliveryLocation.placeholder': 'Enter delivery location',
    'field.receiptNumber': 'Receipt Number',
    'field.receiptNumber.placeholder': 'Enter receipt number',
    'field.date': 'Date',
    'field.time': 'Time',
    'field.deliveryType': 'Type of Delivery',
    'field.deliveryType.placeholder': 'Select delivery type',
    'field.orderDetails': 'Order Details',
    'field.orderDetails.placeholder': 'Enter detailed order information, items, quantities, specifications, etc.',
    'field.totalPayment': 'Total Payment',
    'field.totalPayment.placeholder': '0.000',
    'field.advancePayment': 'Advance Payment',
    'field.advancePayment.placeholder': '0.000',
    'field.balancePayment': 'Balance Payment',
    'field.discount': 'Discount',
    'field.paymentType': 'Type of Payment',
    'field.paymentType.placeholder': 'Select payment type',
    'field.location': 'Location',
    
    // Table Headers
    'table.name': 'Name',
    'table.phoneNumber': 'Phone Number',
    'table.advancePaid': 'Advance Paid',
    'table.total': 'Total',
    'table.status': 'Status',
    'table.cookStatus': 'Cook Status',
    'table.date': 'Date',
    'table.actions': 'Actions',
    
    // Payment Types
    'payment.cash': 'Cash',
    'payment.atm': 'ATM',
    'payment.transfer': 'Transfer',
    
    // Delivery Types
    'delivery.pickup': 'Pickup',
    'delivery.homeDelivery': 'Home Delivery',
    'delivery.expressDelivery': 'Express Delivery',
    'delivery.standardDelivery': 'Standard Delivery',
    
    // Status Types
    'status.paid': 'Paid',
    'status.unpaid': 'Unpaid',
    'status.pending': 'Pending',
    'status.preparing': 'Preparing',
    'status.ready': 'Ready',
    'status.delivered': 'Delivered',
    'status.completed': 'Completed',
    'status.unknown': 'Unknown',
    
    // Actions
    'action.viewDetails': 'View Details',
    'action.editOrder': 'Edit Order',
    'action.updateStatus': 'Update Status',
    'action.markAsPaid': 'Mark as Paid',
    'action.markAsUnpaid': 'Mark as Unpaid',
    'action.shareToCook': 'Share to Cook',
    'action.sharedToCook': 'Shared to Cook',
    'action.deleteOrder': 'Delete Order',
    'action.refresh': 'Refresh',
    'action.exportCSV': 'Export CSV',
    'action.cancel': 'Cancel',
    'action.save': 'Save',
    'action.update': 'Update',
    'action.delete': 'Delete',
    
    // Buttons
    'button.createOrder': 'Create Order',
    'button.creating': 'Creating Order...',
    'button.updateOrder': 'Update Order',
    'button.updating': 'Updating...',
    'button.resetForm': 'Reset Form',
    'button.markReady': 'Mark Ready',
    'button.markCompleted': 'Mark Completed',
    'button.delivered': 'Delivered',
    'button.startPreparing': 'Start Preparing',
    'button.markDelivered': 'Mark Delivered',
    
    // Dialog Titles
    'dialog.orderDetails': 'Order Details',
    'dialog.editOrder': 'Edit Order',
    'dialog.exportOrders': 'Export Orders to CSV',
    'dialog.deleteConfirm': 'Are you sure?',
    'dialog.orderDetailsFor': 'Complete information for order #',
    'dialog.updateOrderFor': 'Update order information for #',
    'dialog.selectDateRange': 'Select date range to export orders. Current filters will be applied.',
    
    // Export
    'export.startDate': 'Start Date',
    'export.endDate': 'End Date',
    'export.willInclude': 'Export will include:',
    'export.orderDetails': 'All order details and customer information',
    'export.paymentInfo': 'Payment information with calculations in OMR',
    'export.statusInfo': 'Order status and cook status',
    'export.currentFilters': 'Current filter settings will be applied',
    'export.confirmExport': 'Export {count} orders from {startDate} to {endDate}?',
    
    // Order Information Sections
    'info.customerInformation': 'Customer Information',
    'info.orderInformation': 'Order Information',
    'info.paymentInformation': 'Payment Information',
    'info.orderStatus': 'Order Status',
    'info.name': 'Name',
    'info.phone': 'Phone',
    'info.location': 'Location',
    'info.receiptNo': 'Receipt No',
    'info.date': 'Date',
    'info.time': 'Time',
    'info.deliveryType': 'Delivery Type',
    'info.totalPayment': 'Total Payment',
    'info.discount': 'Discount',
    'info.finalTotal': 'Final Total',
    'info.advancePayment': 'Advance Payment',
    'info.balancePayment': 'Balance Payment',
    'info.paymentType': 'Payment Type',
    'info.paymentStatus': 'Payment Status',
    'info.created': 'Created',
    'info.cookStatus': 'Cook Status',
    'info.sharedToCook': 'Shared to Cook',
    'info.yes': 'Yes',
    'info.no': 'No',
    'info.customer': 'Customer',
    'info.unknownCustomer': 'Unknown Customer',
    'info.noDate': 'No date',
    'info.noTime': 'No time',
    
    // Calculations
    'calc.finalTotal': 'Final Total',
    'calc.totalMinusDiscount': '(Total Payment - Discount)',
    
    // Messages
    'message.orderCreated': 'Order created successfully!',
    'message.orderCreatedWithKitchen': 'Order created and shared with kitchen',
    'message.orderUpdated': 'Order updated successfully',
    'message.orderDeleted': 'Order deleted successfully',
    'message.statusUpdated': 'Order status updated to {status}',
    'message.cookStatusUpdated': 'Cook status updated to {status}',
    'message.sharedWithCook': 'Order shared with cook successfully',
    'message.orderError': 'Error creating order. Please try again.',
    'message.updateError': 'Failed to update order',
    'message.deleteError': 'Failed to delete order',
    'message.fetchError': 'Failed to fetch orders',
    'message.noOrdersInRange': 'No orders found in the selected date range',
    'message.exportSuccess': 'Exported {count} orders to CSV',
    'message.loading': 'Loading orders...',
    'message.noOrders': 'No orders found',
    'message.noMatchingOrders': 'No orders match the current filters',
    'message.noOrdersForToday': 'No orders for today',
    'message.noOrdersForTomorrow': 'No orders for tomorrow',
    'message.fillRequiredFields': 'Please fill in all required fields',
    'message.noOrderDetails': 'No order details available',
    'message.noOrdersToExport': 'No orders to export',
    
    // Delete Confirmation
    'delete.title': 'Are you sure?',
    'delete.description': 'This action cannot be undone. This will permanently delete the order for {name}.',
    'delete.cancel': 'Cancel',
    'delete.confirm': 'Delete',
    
    // Validation
    'validation.nameRequired': 'Name is required',
    'validation.receiptRequired': 'Receipt number is required',
    'validation.dateRequired': 'Date is required',
    'validation.timeRequired': 'Time is required',
    'validation.phoneRequired': 'Phone number is required',
    'validation.orderDetailsRequired': 'Order details are required',
    'validation.totalPaymentRequired': 'Total payment is required',
    'validation.advancePaymentRequired': 'Advance payment is required',
    'validation.locationRequired': 'Location is required',
    'validation.paymentTypeRequired': 'Please select a payment type',
    'validation.deliveryTypeRequired': 'Delivery type is required',
    'validation.startDateRequired': 'Start date is required',
    'validation.endDateRequired': 'End date is required',
    'validation.balancePositive': 'Balance payment must be positive',
    'validation.discountPositive': 'Discount must be positive'
  },
  ar: {
    // Header
    'language.english': 'الإنجليزية',
    'language.arabic': 'العربية',
    
    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.createOrder': 'إنشاء طلب',
    'nav.allOrders': 'جميع الطلبات',
    'nav.cook': 'المطبخ',
    'nav.kitchenOrders': 'طلبات المطبخ',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً، أهلاً بعودتك 👋',
    'dashboard.totalRevenue': 'إجمالي الإيرادات',
    'dashboard.totalCustomers': 'إجمالي العملاء',
    'dashboard.balanceToPayCustomer': 'الرصيد المستحق للعميل',
    'dashboard.pendingCooking': 'في انتظار الطبخ',
    'dashboard.recentOrders': 'الطلبات الأخيرة',
    'dashboard.quickStats': 'إحصائيات سريعة',
    'dashboard.todayOverview': 'نظرة عامة على اليوم',
    'dashboard.revenueStatus': 'حالة الإيرادات',
    'dashboard.kitchenStatus': 'حالة المطبخ',
    'dashboard.pendingBalance': 'الرصيد المعلق',
    'dashboard.totalCustomersCount': 'إجمالي العملاء',
    'dashboard.latestOrders': 'آخر 5 طلبات من مطعمك',
    'dashboard.noOrdersFound': 'لا توجد طلبات',
    'dashboard.loadingFromFirebase': 'جاري تحميل البيانات من Firebase...',
    'dashboard.firebaseLive': 'Firebase مباشر',
    'dashboard.paidOrders': 'الطلبات المدفوعة',
    'dashboard.unique': 'فريد',
    'dashboard.pending': 'معلق',
    'dashboard.kitchen': 'المطبخ',
    'dashboard.revenueFromPaidOrders': 'الإيرادات من الطلبات المدفوعة',
    'dashboard.sumOfTotalPaymentDiscount': 'مجموع (إجمالي الدفع - الخصم) للطلبات المدفوعة',
    'dashboard.uniqueCustomers': 'عملاء فريدون',
    'dashboard.basedOnUniquePhoneNumbers': 'بناءً على أرقام الهواتف الفريدة',
    'dashboard.outstandingBalance': 'الرصيد المستحق',
    'dashboard.amountPendingFromUnpaidOrders': 'المبلغ المعلق من الطلبات غير المدفوعة',
    'dashboard.ordersInKitchen': 'طلبات في المطبخ',
    'dashboard.ordersWithStatusPendingOrPreparing': 'طلبات بحالة \'معلق\' أو \'قيد التحضير\'',
    'dashboard.active': 'نشط',
    'dashboard.noRevenue': 'لا توجد إيرادات',
    'dashboard.clear': 'واضح',
    'dashboard.allClear': 'كله واضح',
    'dashboard.todayOrders': 'طلبات اليوم',
    'dashboard.cookedOrders': 'الطلبات المطبوخة',
    'dashboard.completedOrders': 'الطلبات المكتملة',
    'dashboard.upcomingOrders': 'الطلبات القادمة',
    'dashboard.ordersForToday': 'طلبات اليوم',
    'dashboard.currentlyCooking': 'قيد الطبخ حالياً',
    'dashboard.deliveredToday': 'تم التسليم اليوم',
    'dashboard.ordersForUpcoming': 'الطلبات القادمة',
    'dashboard.ordersScheduledForToday': 'الطلبات المجدولة لليوم',
    'dashboard.ordersScheduledForUpcoming': 'الطلبات المجدولة للتواريخ القادمة',
    'button.downloadPDF': 'تحميل PDF',
    'message.noOrdersForUpcoming': 'لا توجد طلبات قادمة',
    
    // Create Order Page
    'page.createOrder': 'إنشاء طلب',
    'page.createOrderDescription': 'املأ التفاصيل لإنشاء طلب جديد',
    'page.editOrder': 'تعديل الطلب',
    'page.editOrderDescription': 'قم بتعديل تفاصيل الطلب أدناه',
    'section.orderInformation': 'معلومات الطلب',
    'section.customerInformation': 'معلومات العميل',
    'section.orderDetails': 'تفاصيل الطلب',
    'section.paymentInformation': 'معلومات الدفع',
    
    // All Orders Page
    'page.allOrders': 'جميع الطلبات',
    'page.receptionistDashboard': 'لوحة تحكم الاستقبال',
    'section.ordersManagement': 'إدارة الطلبات',
    'section.filters': 'المرشحات',
    'filter.paymentStatus': 'حالة الدفع',
    'filter.kitchenStatus': 'حالة المطبخ',
    'filter.allStatus': 'جميع الحالات',
    'filter.clearFilters': 'مسح المرشحات',
    'filter.showingResults': 'عرض {count} من {total} طلب',
    'filter.searchPlaceholder': 'البحث في الطلبات بالاسم أو رقم الإيصال أو الهاتف...',
    'filter.dateRange': 'نطاق التاريخ',
    'filter.allDates': 'جميع التواريخ',
    'filter.today': 'اليوم',
    'filter.thisWeek': 'هذا الأسبوع',
    'filter.thisMonth': 'هذا الشهر',
    'filter.clearDates': 'مسح التواريخ',
    
    // Cook Page
    'page.kitchen': 'المطبخ',
    'page.kitchenOrders': 'طلبات المطبخ',
    'cook.activeOrders': 'طلبات نشطة',
    'cook.noOrders': 'لا توجد طلبات في المطبخ',
    'cook.noOrdersDescription': 'الطلبات المشتركة مع المطبخ ستظهر هنا.',
    'cook.orderDetails': 'تفاصيل الطلب:',
    'cook.cookStatus': 'حالة المطبخ:',
    'cook.markCompleted': 'تحديد كمكتمل',
    
    // Form Fields
    'field.customerName': 'اسم العميل',
    'field.customerName.placeholder': 'أدخل اسم العميل',
    'field.phoneNumber': 'رقم الهاتف',
    'field.phoneNumber.placeholder': 'أدخل رقم الهاتف',
    'field.deliveryLocation': 'موقع التسليم',
    'field.deliveryLocation.placeholder': 'أدخل موقع التسليم',
    'field.receiptNumber': 'رقم الإيصال',
    'field.receiptNumber.placeholder': 'أدخل رقم الإيصال',
    'field.date': 'التاريخ',
    'field.time': 'الوقت',
    'field.deliveryType': 'نوع التسليم',
    'field.deliveryType.placeholder': 'اختر نوع التسليم',
    'field.orderDetails': 'تفاصيل الطلب',
    'field.orderDetails.placeholder': 'أدخل تفاصيل الطلب، العناصر، الكميات، المواصفات، إلخ.',
    'field.totalPayment': 'إجمالي الدفع',
    'field.totalPayment.placeholder': '0.000',
    'field.advancePayment': 'الدفع المقدم',
    'field.advancePayment.placeholder': '0.000',
    'field.balancePayment': 'الرصيد المتبقي',
    'field.discount': 'الخصم',
    'field.paymentType': 'نوع الدفع',
    'field.paymentType.placeholder': 'اختر نوع الدفع',
    'field.location': 'الموقع',
    
    // Table Headers
    'table.name': 'الاسم',
    'table.phoneNumber': 'رقم الهاتف',
    'table.advancePaid': 'المدفوع مقدماً',
    'table.total': 'الإجمالي',
    'table.status': 'الحالة',
    'table.cookStatus': 'حالة المطبخ',
    'table.date': 'ا��تاريخ',
    'table.actions': 'الإجراءات',
    
    // Payment Types
    'payment.cash': 'نقدي',
    'payment.atm': 'صراف آلي',
    'payment.transfer': 'تحويل',
    
    // Delivery Types
    'delivery.pickup': 'استلام',
    'delivery.homeDelivery': 'توصيل منزلي',
    'delivery.expressDelivery': 'توصيل سريع',
    'delivery.standardDelivery': 'توصيل عادي',
    
    // Status Types
    'status.paid': 'مدفوع',
    'status.unpaid': 'غير مدفوع',
    'status.pending': 'في الانتظار',
    'status.preparing': 'قيد التحضير',
    'status.ready': 'جاهز',
    'status.delivered': 'تم التسليم',
    'status.completed': 'مكتمل',
    'status.unknown': 'غير معروف',
    
    // Actions
    'action.viewDetails': 'عرض التفاصيل',
    'action.editOrder': 'تعديل الطلب',
    'action.updateStatus': 'تحديث الحالة',
    'action.markAsPaid': 'تحديد كمدفوع',
    'action.markAsUnpaid': 'تحديد كغير مدفوع',
    'action.shareToCook': 'مشاركة مع المطبخ',
    'action.sharedToCook': 'تم المشاركة مع المطبخ',
    'action.deleteOrder': 'حذف الطلب',
    'action.refresh': 'تحديث',
    'action.exportCSV': 'تصدير CSV',
    'action.cancel': 'إلغاء',
    'action.save': 'حفظ',
    'action.update': 'تحديث',
    'action.delete': 'حذف',
    
    // Buttons
    'button.createOrder': 'إنشاء طلب',
    'button.creating': 'جاري إنشاء الطلب...',
    'button.updateOrder': 'تحديث الطلب',
    'button.updating': 'جا��ي التحديث...',
    'button.resetForm': 'إعادة تعيين النموذج',
    'button.markReady': 'تحديد كجاهز',
    'button.markCompleted': 'تحديد كمكتمل',
    'button.delivered': 'تم التسليم',
    'button.startPreparing': 'بدء التحضير',
    'button.markDelivered': 'تحديد كمسلم',
    
    // Dialog Titles
    'dialog.orderDetails': 'تفاصيل الطلب',
    'dialog.editOrder': 'تعديل الطلب',
    'dialog.exportOrders': 'تصدير الطلبات إلى CSV',
    'dialog.deleteConfirm': 'هل أنت متأكد؟',
    'dialog.orderDetailsFor': 'معلومات كاملة للطلب رقم',
    'dialog.updateOrderFor': 'تحديث معلومات الطلب رقم',
    'dialog.selectDateRange': 'اختر نطاق التاريخ لتصدير الطلبات. سيتم تطبيق المرشحات الحالية.',
    
    // Export
    'export.startDate': 'تاريخ البداية',
    'export.endDate': 'تاريخ النهاية',
    'export.willInclude': 'سيشمل التصدير:',
    'export.orderDetails': 'جميع تفاصيل الطلبات ومعلومات العملاء',
    'export.paymentInfo': 'معلومات الدفع مع الحسابات بالريال العماني',
    'export.statusInfo': 'حالة الطلب وحالة المطبخ',
    'export.currentFilters': 'سيتم تطبيق إعدادات المرشح الحالية',
    'export.confirmExport': 'تصدير {count} طلب من {startDate} إلى {endDate}؟',
    
    // Order Information Sections
    'info.customerInformation': 'معلومات العميل',
    'info.orderInformation': 'معلومات الطلب',
    'info.paymentInformation': 'معلومات الدفع',
    'info.orderStatus': 'حالة الطلب',
    'info.name': 'الاسم',
    'info.phone': 'الهاتف',
    'info.location': 'الموقع',
    'info.receiptNo': 'رقم الإيصال',
    'info.date': 'التاريخ',
    'info.time': 'الوقت',
    'info.deliveryType': 'نوع التسليم',
    'info.totalPayment': 'إجمالي الدفع',
    'info.discount': 'الخصم',
    'info.finalTotal': 'الإجمالي النهائي',
    'info.advancePayment': 'الدفع المقدم',
    'info.balancePayment': 'الرصيد المتبقي',
    'info.paymentType': 'نوع الدفع',
    'info.paymentStatus': 'حالة الدفع',
    'info.created': 'تم الإنشاء',
    'info.cookStatus': 'حالة المطبخ',
    'info.sharedToCook': 'مشارك مع المطبخ',
    'info.yes': 'نعم',
    'info.no': 'لا',
    'info.customer': 'العميل',
    'info.unknownCustomer': 'عميل غير معروف',
    'info.noDate': 'لا يوجد تاريخ',
    'info.noTime': 'لا يوجد وقت',
    
    // Calculations
    'calc.finalTotal': 'الإجمالي النهائي',
    'calc.totalMinusDiscount': '(إجمالي الدفع - الخصم)',
    
    // Messages
    'message.orderCreated': 'تم إنشاء الطلب بنجاح!',
    'message.orderCreatedWithKitchen': 'تم إ��شاء الطلب ومشاركته مع المطبخ',
    'message.orderUpdated': 'تم تحديث الطلب بنجاح',
    'message.orderDeleted': 'تم حذف الطلب بنجاح',
    'message.statusUpdated': 'تم تحديث حالة الطلب إلى {status}',
    'message.cookStatusUpdated': 'تم تحديث حالة المطبخ إلى {status}',
    'message.sharedWithCook': 'تم مشاركة الطلب مع المطبخ بنجاح',
    'message.orderError': 'خطأ في إنشاء الطلب. يرجى المحاولة مرة أخرى.',
    'message.updateError': 'فشل في تحديث الطلب',
    'message.deleteError': 'فشل في حذف الطلب',
    'message.fetchError': 'فشل في جلب الطلبات',
    'message.noOrdersInRange': 'لا توجد طلبات في النطاق الزمني المحدد',
    'message.exportSuccess': 'تم تصدير {count} طلب إلى CSV',
    'message.loading': 'جاري التحميل...',
    'message.noOrders': 'لا توجد طلبات',
    'message.noMatchingOrders': 'لا توجد طلبات تطابق المرشحات الحالية',
    'message.noOrdersForToday': 'لا توجد طلبات لليوم',
    'message.noOrdersForTomorrow': 'لا توجد طلبات للغد',
    'message.fillRequiredFields': 'يرجى ملء جميع الحقول المطلوبة',
    'message.noOrderDetails': 'لا توجد تفاصيل للطلب',
    'message.noOrdersToExport': 'لا توجد طلبات للتصدير',
    
    // Delete Confirmation
    'delete.title': 'هل أنت متأكد؟',
    'delete.description': 'لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف الطلب نهائياً للعميل {name}.',
    'delete.cancel': 'إلغاء',
    'delete.confirm': 'حذف',
    
    // Validation
    'validation.nameRequired': 'الاسم مطلوب',
    'validation.receiptRequired': 'رقم الإيصال مطلوب',
    'validation.dateRequired': 'التاريخ مطلوب',
    'validation.timeRequired': 'الوقت مطلوب',
    'validation.phoneRequired': 'رقم الهاتف مطلوب',
    'validation.orderDetailsRequired': 'تفاصيل الطلب مطلوبة',
    'validation.totalPaymentRequired': 'إجمالي الدفع مطلوب',
    'validation.advancePaymentRequired': 'الدفع المقدم مطلوب',
    'validation.locationRequired': 'الموقع مطلوب',
    'validation.paymentTypeRequired': 'يرجى اختيار نوع الدفع',
    'validation.deliveryTypeRequired': 'نوع التسليم مطلوب',
    'validation.startDateRequired': 'تاريخ البداية مطلوب',
    'validation.endDateRequired': 'تاريخ النهاية مطلوب',
    'validation.balancePositive': 'الرصيد المتبقي يجب أن يكون موجباً',
    'validation.discountPositive': 'الخصم يجب أن يكون موجباً'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
    // Keep LTR direction for both languages to maintain layout
    document.documentElement.dir = 'ltr';
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}