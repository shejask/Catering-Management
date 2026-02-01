import { redirect } from 'next/navigation';

export default async function ManagerDashboard() {
  // Redirect to all orders management page
  redirect('/dashboard/all-orders')
} 