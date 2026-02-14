import { redirect } from 'next/navigation';

export default async function Dashboard() {
  // Redirect directly to dashboard overview without authentication
  redirect('/dashboard/overview');
}
