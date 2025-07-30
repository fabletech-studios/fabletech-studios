import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { authOptions } from '@/lib/auth';

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session) {
    redirect('/admin/login');
  }
  
  // Check if user has admin role
  if ((session.user as any).role !== 'admin') {
    console.warn(`Unauthorized access attempt by: ${session.user?.email}`);
    redirect('/');
  }

  // Log admin access for security audit
  const headersList = headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  
  console.log(`[ADMIN ACCESS] User: ${session.user?.email} | IP: ${ip} | Time: ${new Date().toISOString()} | UA: ${userAgent.substring(0, 50)}...`);

  return <>{children}</>;
}