import { redirect } from 'next/navigation';

export default async function ReceptionistDashboard() {
  // Redirect to receptionist overview
  redirect('/dashboard/receptionist/overview');
} 