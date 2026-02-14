'use client';

import { redirect } from 'next/navigation';

export default function FinancialOrdersPage() {
  // Redirect to the existing financial all-orders page
  redirect('/dashboard/financial/all-orders');
} 