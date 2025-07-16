'use client';

import Link from "next/link";
import { Play } from "lucide-react";
import CustomerHeaderLazy from "@/components/CustomerHeaderLazy";

export default function HomeClient() {
  return (
    <header className="border-b border-gray-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-red-600">FableTech Studios</h1>
          </div>
          <div className="flex items-center space-x-8">
            <Link href="/browse" className="hover:text-gray-300">Browse</Link>
            <CustomerHeaderLazy />
          </div>
        </div>
      </nav>
    </header>
  );
}