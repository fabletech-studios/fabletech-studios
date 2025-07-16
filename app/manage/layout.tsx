import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';

export default async function ManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user as any).role !== 'admin') {
    redirect('/admin/login');
  }

  return <>{children}</>;
}