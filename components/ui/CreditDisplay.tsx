'use client';

import { Coins } from 'lucide-react';
import { useCredits } from '@/hooks/useCredits';

export default function CreditDisplay() {
  const { credits, loading } = useCredits();

  if (loading) {
    return (
      <div className="flex items-center gap-2 animate-pulse">
        <Coins className="w-5 h-5 text-gray-500" />
        <div className="w-12 h-5 bg-gray-700 rounded" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Coins className="w-5 h-5 text-yellow-500" />
      <span className="font-semibold">{credits.toLocaleString()}</span>
    </div>
  );
}