import { redirect } from 'next/navigation';

export default async function FinancialDashboard() {
  // Redirect to financial orders management page
  redirect('/dashboard/financial/orders');
} 