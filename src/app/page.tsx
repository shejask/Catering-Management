import { redirect } from 'next/navigation';

export default async function Page() {
  // Redirect directly to dashboard without authentication
  redirect('/dashboard/overview');
}
