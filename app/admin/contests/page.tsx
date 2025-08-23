'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminContestsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the existing contest management page
    router.replace('/contest');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Redirecting to contest page...</p>
      </div>
    </div>
  );
}